import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import ReactHtmlParser from 'react-html-parser';

import Loader from '../Loader';
import GoBackButton from '../GoBackButton';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ShowTypeDonations from '../ShowTypeDonations';
import CommunityButton from '../CommunityButton';
import User from '../../models/User';
import CampaignCard from '../CampaignCard';
import { getUserName, getUserAvatar } from '../../lib/helpers';
import BaseWallet from '../../lib/blockchain/BaseWallet';
import DACservice from '../../services/DAC';

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

    // Get the Campaign
    DACservice.get(dacId)
      .then(dac => {
        this.setState({ dac, isLoading: false });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      }); // TODO: inform user of error

    // Lazy load donations
    this.donationsObserver = DACservice.subscribeDonations(
      dacId,
      donations => {
        this.setState({ donations, isLoadingDonations: false });
      },
      () => this.setState({ isLoadingDonations: false }), // TODO: inform user of error
    );

    // Lazy load campaigns
    this.campaignsObserver = DACservice.subscribeCampaigns(
      dacId,
      campaigns => {
        this.setState({ campaigns, isLoadingCampaigns: false });
      },
      () => this.setState({ isLoadingCampaigns: false }), // TODO: inform user of error
    );
  }

  componentWillUnmount() {
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
    if (this.campaignsObserver) this.campaignsObserver.unsubscribe();
  }

  render() {
    const { wallet, history, currentUser } = this.props;
    const {
      isLoading,
      donations,
      dac,
      isLoadingDonations,
      communityUrl,
      isLoadingCampaigns,
      campaigns,
    } = this.state;

    return (
      <div id="view-cause-view">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div>
            <BackgroundImageHeader image={dac.image} height={300}>
              <h6>Decentralized Altruistic Community</h6>
              <h1>{dac.title}</h1>

              <DonateButton
                type="DAC"
                model={{
                  title: dac.title,
                  id: dac.id,
                  adminId: dac.delegateId,
                }}
                wallet={wallet}
                currentUser={currentUser}
                commmunityUrl={communityUrl}
                history={history}
              />
              {communityUrl && (
                <CommunityButton className="btn btn-secondary" url={communityUrl}>
                  &nbsp;Join our community
                </CommunityButton>
              )}
            </BackgroundImageHeader>

            <div className="container-fluid">
              <div className="row">
                <div className="col-md-8 m-auto">
                  <GoBackButton history={history} />

                  <center>
                    <Link to={`/profile/${dac.owner.address}`}>
                      <Avatar size={50} src={getUserAvatar(dac.owner)} round />
                      <p className="small">{getUserName(dac.owner)}</p>
                    </Link>
                  </center>

                  <div className="card content-card">
                    <div className="card-body content">{ReactHtmlParser(dac.description)}</div>
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto card-view">
                  <h4>{campaigns ? campaigns.length : 0} Campaign(s)</h4>
                  <p>
                    These Campaigns are working hard to solve the cause of this Community (DAC){' '}
                  </p>
                  {campaigns &&
                    campaigns.length > 0 &&
                    isLoadingCampaigns && <Loader className="small" />}

                  {campaigns &&
                    campaigns.length > 0 &&
                    !isLoadingCampaigns && (
                      <div className="cards-grid-container">
                        {campaigns.map(c => (
                          <CampaignCard
                            key={c.id}
                            campaign={c}
                            currentUser={currentUser}
                            wallet={wallet}
                            history={history}
                          />
                        ))}
                      </div>
                    )}
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  <DonateButton
                    type="DAC"
                    model={{
                      title: dac.title,
                      id: dac.id,
                      adminId: dac.delegateId,
                    }}
                    wallet={wallet}
                    currentUser={currentUser}
                    history={history}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
  wallet: PropTypes.instanceOf(BaseWallet),
};

ViewDAC.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default ViewDAC;
