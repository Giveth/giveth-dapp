import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import ReactHtmlParser from 'react-html-parser';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneCard from '../MilestoneCard';
import GoBackButton from '../GoBackButton';
import { isOwner, getUserName, getUserAvatar } from '../../lib/helpers';
import { checkWalletBalance } from '../../lib/middleware';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import CommunityButton from '../CommunityButton';
import DelegateMultipleButton from '../DelegateMultipleButton';
import ShowTypeDonations from '../ShowTypeDonations';
import AuthenticatedLink from '../AuthenticatedLink';

import User from '../../models/User';
import Campaign from '../../models/Campaign';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import CampaignService from '../../services/CampaignService';

import ErrorPopup from '../ErrorPopup';
import ErrorBoundary from '../ErrorBoundary';

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
      isLoadingMilestones: true,
      isLoadingDonations: true,
      donations: [],
      milestones: [],
      milestonesLoaded: 0,
      milestonesTotal: 0,
      milestonesPerBatch: 50,
    };

    this.loadMoreMilestones = this.loadMoreMilestones.bind(this);
  }

  componentDidMount() {
    const campaignId = this.props.match.params.id;

    CampaignService.get(campaignId)
      .then(campaign => this.setState({ campaign, isLoading: false }))
      .catch(err => {
        ErrorPopup('Something went wrong loading campaign. Please try refresh the page.', err);
        this.setState({ isLoading: false });
      }); // TODO: inform user of error

    this.loadMoreMilestones(campaignId);

    // Lazy load donations
    this.donationsObserver = CampaignService.subscribeDonations(
      campaignId,
      donations =>
        this.setState({
          donations,
          isLoadingDonations: false,
        }),
      () => this.setState({ isLoadingDonations: false }),
    );
  }

  componentWillUnmount() {
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
  }

  loadMoreMilestones(campaignId = this.props.match.params.id) {
    this.setState({ isLoadingMilestones: true }, () =>
      CampaignService.getMilestones(
        campaignId,
        this.state.milestonesPerBatch,
        this.state.milestonesLoaded,
        (milestones, milestonesTotal) =>
          this.setState(prevState => ({
            milestones: prevState.milestones.concat(milestones),
            isLoadingMilestones: false,
            milestonesTotal,
            milestonesLoaded: prevState.milestonesLoaded + milestones.length,
          })),
        () => this.setState({ isLoadingMilestones: false }),
      ),
    );
  }

  removeMilestone(id) {
    checkWalletBalance(this.props.wallet)
      .then(() => {
        React.swal({
          title: 'Delete Milestone?',
          text: 'You will not be able to recover this milestone!',
          icon: 'warning',
          dangerMode: true,
        }).then(() => {
          const milestones = feathersClient.service('/milestones');
          milestones.remove(id);
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { history, currentUser, wallet, to } = this.props;
    const {
      isLoading,
      campaign,
      milestones,
      donations,
      isLoadingDonations,
      isLoadingMilestones,
      milestonesLoaded,
      milestonesTotal,
    } = this.state;
    if (!campaign) return <p>Unable to find a campaign</p>;
    return (
      <ErrorBoundary>
        <div id="view-campaign-view">
          {isLoading && <Loader className="fixed" />}

          {!isLoading && (
            <div>
              <BackgroundImageHeader image={campaign.image} height={300}>
                <h6>Campaign</h6>
                <h1>{campaign.title}</h1>
                <DonateButton
                  model={{
                    type: Campaign.type,
                    title: campaign.title,
                    id: campaign.id,
                    adminId: campaign.projectId,
                  }}
                  wallet={wallet}
                  currentUser={currentUser}
                  history={history}
                />
                {currentUser && (
                  <DelegateMultipleButton
                    style={{ padding: '10px 10px' }}
                    campaign={campaign}
                    wallet={wallet}
                    currentUser={currentUser}
                  />
                )}
                {campaign.communityUrl && (
                  <CommunityButton className="btn btn-secondary" url={campaign.communityUrl}>
                    Join our community
                  </CommunityButton>
                )}
              </BackgroundImageHeader>

              <div className="container-fluid">
                <div className="row">
                  <div className="col-md-8 m-auto">
                    <GoBackButton history={history} title="Campaigns" />

                    <center>
                      <Link to={`/profile/${campaign.owner.address}`}>
                        <Avatar size={50} src={getUserAvatar(campaign.owner)} round />
                        <p className="small">{getUserName(campaign.owner)}</p>
                      </Link>
                    </center>

                    <div className="card content-card ">
                      <div className="card-body content">
                        {ReactHtmlParser(campaign.description)}
                      </div>
                    </div>

                    <div className="milestone-header spacer-top-50 card-view">
                      <h3>Milestones</h3>
                      {campaign.projectId > 0 &&
                        isOwner(campaign.owner.address, currentUser) && (
                          <AuthenticatedLink
                            className="btn btn-primary btn-sm pull-right"
                            to={`/campaigns/${campaign.id}/milestones/new`}
                            wallet={wallet}
                          >
                            Add Milestone
                          </AuthenticatedLink>
                        )}

                      {campaign.projectId > 0 &&
                        !isOwner(campaign.owner.address, currentUser) &&
                        currentUser && (
                          <AuthenticatedLink
                            className="btn btn-primary btn-sm pull-right"
                            to={`/campaigns/${campaign.id}/milestones/propose`}
                            wallet={wallet}
                          >
                            Propose Milestone
                          </AuthenticatedLink>
                        )}

                      {isLoadingMilestones &&
                        milestonesTotal === 0 && <Loader className="relative" />}
                      <ResponsiveMasonry
                        columnsCountBreakPoints={{
                          0: 1,
                          470: 2,
                          900: 3,
                          1200: 4,
                        }}
                      >
                        <Masonry gutter="10px">
                          {milestones.map(m => (
                            <MilestoneCard
                              milestone={m}
                              currentUser={currentUser}
                              key={m._id}
                              history={history}
                              wallet={wallet}
                              removeMilestone={() => this.removeMilestone(m._id)}
                            />
                          ))}
                        </Masonry>
                      </ResponsiveMasonry>

                      {milestonesLoaded < milestonesTotal && (
                        <center>
                          <button
                            type="button"
                            className="btn btn-info"
                            onClick={() => this.loadMoreMilestones()}
                            disabled={isLoadingMilestones}
                          >
                            {isLoadingMilestones && (
                              <span>
                                <i className="fa fa-circle-o-notch fa-spin" /> Loading
                              </span>
                            )}
                            {!isLoadingMilestones && <span>Load More</span>}
                          </button>
                        </center>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row spacer-top-50 spacer-bottom-50">
                  <div className="col-md-8 m-auto">
                    <h4>Donations</h4>
                    <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                    <DonateButton
                      model={{
                        type: Campaign.type,
                        title: campaign.title,
                        id: campaign.id,
                        adminId: campaign.projectId,
                      }}
                      wallet={wallet}
                      currentUser={currentUser}
                      history={history}
                    />
                  </div>
                </div>
                <div className="row spacer-top-50 spacer-bottom-50">
                  <div className="col-md-8 m-auto">
                    <h4>Campaign Reviewer</h4>
                    {campaign &&
                      campaign.reviewer && (
                        <Link to={`/profile/${campaign.reviewer.address}`}>
                          {getUserName(campaign.reviewer)}
                        </Link>
                      )}
                    {campaign.myReviewerAddress === currentUser.address && (
                      <a
                        className="btn btn-sm"
                        href={to}
                        onClick={() => React.changeReviewer(() => history.push(to))}
                      >
                        Change Reviewer
                      </a>
                    )}
                    {(!campaign || !campaign.reviewer) && <span>Unknown user</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }
}

ViewCampaign.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  to: PropTypes.string.isRequired,
  currentUser: PropTypes.instanceOf(User),
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
