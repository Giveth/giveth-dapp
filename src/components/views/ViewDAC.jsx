import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import GoBackButton from '../GoBackButton';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ShowTypeDonations from '../ShowTypeDonations';
import CommunityButton from '../CommunityButton';
import User from '../../models/User';
import CampaignCard from '../CampaignCard';
import { getUserName, getUserAvatar } from '../../lib/helpers';
import GivethWallet from '../../lib/blockchain/GivethWallet';

/**
 * The DAC detail view mapped to /dac/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class ViewDAC extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      isLoadingDonations: true,
      donations: [],
      isLoadingCampaigns: true,
      campaigns: [],
    };
  }

  componentDidMount() {
    const dacId = this.props.match.params.id;

    feathersClient.service('dacs').find({ query: { _id: dacId } })
      .then((resp) => {
        this.setState(Object.assign({}, resp.data[0], {
          isLoading: false,
          hasError: false,
        }));
      })
      .catch(() =>
        this.setState({ isLoading: false, id: dacId }));

    // lazy load donations
    this.donationsObserver = feathersClient.service('donations/history').watch({ listStrategy: 'always' }).find({
      query: {
        delegateId: dacId,
        $sort: { createdAt: -1 },
      },
    }).subscribe(
      (resp) => {
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
        });
      },
      () => this.setState({ isLoadingDonations: false }),
    );

    // lazy load campaigns
    this.campaignsObserver = feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
      query: {
        projectId: {
          $gt: '0', // 0 is a pending campaign
        },
        dacs: dacId,
        $limit: 200,
      },
    }).subscribe(
      (resp) => {
        this.setState({ campaigns: resp.data, isLoadingCampaigns: false });
      },
      () => {
        this.setState({ isLoadingCampaigns: false });
      },
    );
  }

  componentWillUnmount() {
    // this.donationsObserver.unsubscribe()
    this.campaignsObserver.unsubscribe();
  }

  render() {
    const { wallet, history, currentUser } = this.props;
    const {
      isLoading, id, delegateId, title, description, image, owner, donations,
      isLoadingDonations, communityUrl, campaignsCount, isLoadingCampaigns, campaigns,
    } = this.state;

    return (
      <div id="view-cause-view">
        { isLoading &&
          <Loader className="fixed" />
        }

        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <h6>Decentralized Altruistic Community</h6>
              <h1>{title}</h1>

              <DonateButton
                type="DAC"
                model={{ title, id, adminId: delegateId }}
                wallet={wallet}
                currentUser={currentUser}
                commmunityUrl={communityUrl}
                history={history}
              />
              {communityUrl &&
                <CommunityButton
                  className="btn btn-secondary"
                  url={communityUrl}
                >&nbsp;Join our community
                </CommunityButton>
              }
            </BackgroundImageHeader>

            <div className="container-fluid">

              <div className="row">
                <div className="col-md-8 m-auto">

                  <GoBackButton history={history} />

                  <center>
                    <Link to={`/profile/${owner.address}`}>
                      <Avatar size={50} src={getUserAvatar(owner)} round />
                      <p className="small">{getUserName(owner)}</p>
                    </Link>
                  </center>

                  <div className="card content-card">
                    <div className="card-body content">
                      <div dangerouslySetInnerHTML={{ __html: description }}>
                        { /* TODO: Find an alternative to dangerouslySetInnerHTML */ }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto card-view">
                  <h4>{campaignsCount} campaign(s)</h4>
                  <p>These campaigns are working hard to solve the cause of this DAC</p>

                  { campaignsCount > 0 && isLoadingCampaigns &&
                    <Loader className="small" />
                  }

                  { campaignsCount > 0 && !isLoadingCampaigns &&
                    <div className="card-deck">
                      { campaigns.map(c =>

                        (<CampaignCard
                          key={c._id} // eslint-disable-line no-underscore-dangle
                          campaign={c}
                          currentUser={currentUser}
                          wallet={wallet}
                          history={history}
                        />))}
                    </div>
                  }

                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  <DonateButton
                    type="DAC"
                    model={{ title, id, adminId: delegateId }}
                    wallet={wallet}
                    currentUser={currentUser}
                    history={history}
                  />
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

ViewDAC.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet),
};

ViewDAC.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default ViewDAC;
