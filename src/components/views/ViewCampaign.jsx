import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneCard from '../MilestoneCard';
import GoBackButton from '../GoBackButton';
import { isOwner, getUserName, getUserAvatar } from '../../lib/helpers';
import { checkWalletBalance } from '../../lib/middleware';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ShowTypeDonations from '../ShowTypeDonations';
import AuthenticatedLink from '../AuthenticatedLink';

import currentUserModel from '../../models/currentUserModel';
import GivethWallet from '../../lib/blockchain/GivethWallet';

/**
 * The Campaign detail view mapped to /campaing/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class ViewCampaign extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isLoadingDonations: true,
      donations: [],
    };
  }

  componentDidMount() {
    const campaignId = this.props.match.params.id;

    Promise.all([
      new Promise((resolve, reject) => {
        feathersClient.service('campaigns').find({ query: { _id: campaignId } })
          .then((resp) => {
            this.setState(resp.data[0], resolve());
          })
          .catch(() => {
            this.setState(reject());
          });
      }),
      new Promise((resolve, reject) => {
        this.milestoneObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({
          query: {
            campaignId,
            projectId: {
              $gt: '0', // 0 is a pending milestone
            },
            $sort: { completionDeadline: 1 },
          },
        }).subscribe(
          (resp) => {
            this.setState({ milestones: resp.data }, resolve());
          },
          () => reject(),
        );
      }),
    ]).then(() => this.setState({ isLoading: false, id: campaignId }))
      .catch(() => {
        this.setState({ isLoading: false });
      });


    // lazy load donations
    this.donationsObserver = feathersClient.service('donations/history').watch({ listStrategy: 'always' }).find({
      query: {
        ownerId: campaignId,
        $sort: { createdAt: -1 },
      },
    }).subscribe(
      resp =>
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
        }),
      () => this.setState({ isLoadingDonations: false }),
    );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
    this.milestoneObserver.unsubscribe();
  }

  removeMilestone(id) {
    checkWalletBalance(this.props.wallet, this.props.history).then(() => {
      React.swal({
        title: 'Delete Milestone?',
        text: 'You will not be able to recover this milestone!',
        icon: 'warning',
        dangerMode: true,
      }).then(() => {
        const milestones = feathersClient.service('/milestones');
        milestones.remove(id);
      });
    });
  }

  render() {
    const { history, currentUser, wallet } = this.props;
    const {
      isLoading, id, projectId, title, description, image, milestones,
      owner, donations, isLoadingDonations,
    } = this.state;

    return (
      <div id="view-campaign-view">
        { isLoading &&
          <Loader className="fixed" />
        }

        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <h6>Campaign</h6>
              <h1>{title}</h1>

              <DonateButton
                type="campaign"
                model={{ title, id, adminId: projectId }}
                wallet={wallet}
                currentUser={currentUser}
                history={history}
              />
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

                  <div className="card content-card ">
                    <div className="card-body content">
                      <div dangerouslySetInnerHTML={{ __html: description }}>
                        {/* TODO: Find more sensible way of showing the description */}
                      </div>
                    </div>
                  </div>

                  <div className="milestone-header spacer-top-50 card-view">
                    <h3>Milestones</h3>
                    { isOwner(owner.address, currentUser) &&
                      <AuthenticatedLink className="btn btn-primary btn-sm pull-right" to={`/campaigns/${id}/milestones/new`} wallet={wallet}>Add Milestone</AuthenticatedLink>
                    }

                    {milestones.length > 0 && milestones.map(m =>
                      (<MilestoneCard
                        milestone={m}
                        currentUser={currentUser}
                        key={m._id} // eslint-disable-line no-underscore-dangle
                        history={history}
                        wallet={wallet}
                        // eslint-disable-next-line no-underscore-dangle
                        removeMilestone={() => this.removeMilestone(m._id)}
                      />))}
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  <DonateButton
                    type="campaign"
                    model={{ title, id, adminId: projectId }}
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

ViewCampaign.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: currentUserModel,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet),
};

ViewCampaign.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default ViewCampaign;
