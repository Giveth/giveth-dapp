import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink } from 'react-router-dom';
import Avatar from 'react-avatar';
import BigNumber from 'bignumber.js';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Balances from 'components/Balances';
import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneCard from '../MilestoneCard';
import GoBackButton from '../GoBackButton';
import { getUserName, getUserAvatar, history, scrollToById } from '../../lib/helpers';
import { checkBalance } from '../../lib/middleware';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import CommunityButton from '../CommunityButton';
import DelegateMultipleButton from '../DelegateMultipleButton';
import ChangeOwnershipButton from '../ChangeOwnershipButton';
import DonationList from '../DonationList';
import DescriptionRender from '../DescriptionRender';

import User from '../../models/User';
import Campaign from '../../models/Campaign';
import CampaignService from '../../services/CampaignService';

import ErrorPopup from '../ErrorPopup';
import ErrorBoundary from '../ErrorBoundary';
import ShareOptions from '../ShareOptions';
import config from '../../configuration';
import CreateDonationAddressButton from '../CreateDonationAddressButton';
import NotFound from './NotFound';
import ProjectViewActionAlert from '../projectViewActionAlert';

/**
 * The Campaign detail view mapped to /campaing/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param balance      User's current balance
 */

const helmetContext = {};

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
      milestonesPerBatch: 12,
      donationsTotal: 0,
      donationsPerBatch: 5,
      newDonations: 0,
      notFound: false,
    };

    this.loadMoreMilestones = this.loadMoreMilestones.bind(this);
    this.loadMoreDonations = this.loadMoreDonations.bind(this);
  }

  componentDidMount() {
    const campaignId = this.props.match.params.id;

    CampaignService.get(campaignId)
      .then(campaign => {
        this.setState({ campaign, isLoading: false });
      })
      .catch(() => {
        this.setState({ notFound: true });
      });

    this.loadMoreMilestones(campaignId);

    this.loadMoreDonations();
    // subscribe to donation count
    this.donationsObserver = CampaignService.subscribeNewDonations(
      campaignId,
      newDonations =>
        this.setState({
          newDonations,
        }),
      () => this.setState({ newDonations: 0 }),
    );
  }

  componentWillUnmount() {
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
  }

  loadMoreDonations() {
    this.setState({ isLoadingDonations: true }, () =>
      CampaignService.getDonations(
        this.props.match.params.id,
        this.state.donationsPerBatch,
        this.state.donations.length,
        (donations, donationsTotal) =>
          this.setState(prevState => ({
            donations: prevState.donations.concat(donations),
            isLoadingDonations: false,
            donationsTotal,
          })),
        () => this.setState({ isLoadingDonations: false }),
      ),
    );
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
    checkBalance(this.props.balance)
      .then(() => {
        React.swal({
          title: 'Delete Milestone?',
          text: 'You will not be able to recover this Milestone!',
          icon: 'warning',
          dangerMode: true,
        }).then(() => {
          const milestones = feathersClient.service('/milestones');
          milestones.remove(id);
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance .', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  editCampaign(id) {
    checkBalance(this.props.balance)
      .then(() => {
        history.push(`/campaigns/${id}/edit`);
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  renderDescription() {
    return DescriptionRender(this.state.campaign.description);
  }

  render() {
    const { currentUser, balance } = this.props;
    const { campaignUrl } = config;
    const {
      isLoading,
      campaign,
      milestones,
      donations,
      isLoadingDonations,
      isLoadingMilestones,
      milestonesLoaded,
      milestonesTotal,
      donationsTotal,
      newDonations,
      notFound,
    } = this.state;

    if (notFound) {
      return <NotFound projectType="Campaign" />;
    }

    if (!isLoading && !campaign) return <p>Unable to find a campaign</p>;

    const userAddress = currentUser && currentUser.address;
    const ownerAddress = campaign && campaign.ownerAddress;
    const userIsOwner = userAddress && userAddress === ownerAddress;
    const donationAddress = campaign && campaign.donationAddress;

    const showDonateAddress = donationAddress || userIsOwner;

    return (
      <HelmetProvider context={helmetContext}>
        <ErrorBoundary>
          <div id="view-campaign-view">
            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <div>
                <Helmet>
                  <title>{campaign.title}</title>

                  {/* Google / Search Engine Tags */}
                  <meta itemProp="name" content={campaign.title} />
                  <meta itemProp="description" content={campaign.description} />
                  <meta itemProp="image" content={campaign.image} />

                  {/* Facebook Meta Tags */}
                  <meta property="og:url" content={campaignUrl + campaign.id} />
                  <meta property="og:type" content="website" />
                  <meta property="og:title" content={campaign.title} />
                  <meta property="og:description" content={campaign.description} />
                  <meta property="og:image" content={campaign.image} />

                  {/* Twitter Meta Tags */}
                  <meta name="twitter:card" content="summary_large_image" />
                  <meta name="twitter:title" content={campaign.title} />
                  <meta name="twitter:description" content={campaign.description} />
                  <meta name="twitter:image" content={campaign.image} />
                </Helmet>
                <BackgroundImageHeader
                  image={campaign.image}
                  height={300}
                  adminId={campaign.projectId}
                  projectType="Campaign"
                  editProject={userIsOwner && (() => this.editCampaign(campaign.id))}
                  cancelProject={() => {}}
                >
                  <h6>Campaign</h6>
                  <h1>{campaign.title}</h1>
                  {campaign.isActive && (
                    <div className="mt-4">
                      <DonateButton
                        model={{
                          type: Campaign.type,
                          title: campaign.title,
                          id: campaign.id,
                          adminId: campaign.projectId,
                        }}
                        currentUser={currentUser}
                        history={history}
                        autoPopup
                        className="btn-lg px-5"
                      />
                    </div>
                  )}
                  {campaign.communityUrl && (
                    <CommunityButton className="btn btn-secondary" url={campaign.communityUrl}>
                      Join our Community
                    </CommunityButton>
                  )}
                </BackgroundImageHeader>

                <div className="go-back-section container-fluid vertical-align mb-4">
                  <GoBackButton to="/campaigns" title="Campaigns" />
                  <nav className="nav nav-center">
                    <li className="nav-item">
                      <NavLink
                        className="nav-link mr-auto"
                        to="#"
                        onClick={() => scrollToById('description')}
                      >
                        About
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link mr-auto"
                        to="#"
                        onClick={() => scrollToById('donations')}
                      >
                        Leaderboard{donationsTotal && ` (${donationsTotal})`}
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link mr-auto"
                        to="#"
                        onClick={() => scrollToById('funding')}
                      >
                        Funding
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link mr-auto"
                        to="#"
                        onClick={() => scrollToById('milestones')}
                      >
                        Milestones{milestonesTotal && ` (${milestonesTotal})`}
                      </NavLink>
                    </li>
                  </nav>
                  <ShareOptions pageUrl={window.location.href} pageTitle={campaign.title} />
                </div>

                <div className="container-fluid mt-4">
                  <div className="row">
                    <div className="col-md-8 m-auto">
                      {showDonateAddress && (
                        <ProjectViewActionAlert message="Send money to an address to contribute">
                          <CreateDonationAddressButton
                            campaignTitle={campaign.title}
                            campaignOwner={ownerAddress}
                            campaignId={campaign.id}
                            receiverId={campaign.projectId}
                            giverId={(campaign._owner || {}).giverId}
                            currentUser={currentUser}
                          />
                        </ProjectViewActionAlert>
                      )}

                      {currentUser && (
                        <ProjectViewActionAlert message="Delegate some donation to this project">
                          <DelegateMultipleButton
                            campaign={campaign}
                            balance={balance}
                            currentUser={currentUser}
                          />
                        </ProjectViewActionAlert>
                      )}

                      {userIsOwner && (
                        <ProjectViewActionAlert message="Change ownership of Campaign">
                          <ChangeOwnershipButton
                            campaign={campaign}
                            balance={balance}
                            currentUser={currentUser}
                            {...this.props}
                          />
                        </ProjectViewActionAlert>
                      )}

                      <div id="description" className="pt-4 about-section-header">
                        <h5 className="title">About</h5>
                        <div className="text-center">
                          <Link to={`/profile/${ownerAddress}`}>
                            <Avatar size={50} src={getUserAvatar(campaign.owner)} round />
                            <p className="small">{getUserName(campaign.owner)}</p>
                          </Link>
                        </div>
                      </div>

                      <div className="card content-card ">
                        <div className="card-body content">{this.renderDescription()}</div>
                      </div>

                      <div className="spacer-top-50 card-view">
                        <div id="donations" className="section-header">
                          <h5>Donations{donationsTotal && ` (${donationsTotal})`}</h5>
                          {campaign.isActive && (
                            <DonateButton
                              model={{
                                type: Campaign.type,
                                title: campaign.title,
                                id: campaign.id,
                                adminId: campaign.projectId,
                                token: { symbol: config.nativeTokenName },
                              }}
                              currentUser={currentUser}
                              history={history}
                            />
                          )}
                        </div>
                        <DonationList
                          donations={donations}
                          isLoading={isLoadingDonations}
                          total={donationsTotal}
                          loadMore={this.loadMoreDonations}
                          newDonations={newDonations}
                        />

                        <div id="funding">
                          <div className="section-header">
                            <h5>Funding</h5>
                            <span>
                              <a
                                className="btn btn-link"
                                href={`${config.feathersConnection}/campaigncsv/${campaign.id}`}
                                type="button"
                                download={`${campaign.id}.csv`}
                              >
                                Download this Campaign&apos;s Financial History
                              </a>
                              {campaign.isActive && (
                                <Fragment>
                                  <DelegateMultipleButton
                                    className="ml-2"
                                    campaign={campaign}
                                    balance={balance}
                                    currentUser={currentUser}
                                  />
                                  <span className="ml-2">
                                    <DonateButton
                                      model={{
                                        type: Campaign.type,
                                        title: campaign.title,
                                        id: campaign.id,
                                        adminId: campaign.projectId,
                                        token: {
                                          symbol: config.nativeTokenName,
                                        },
                                      }}
                                      currentUser={currentUser}
                                      history={history}
                                    />
                                  </span>
                                </Fragment>
                              )}
                            </span>
                          </div>
                          <Balances entity={campaign} />
                        </div>

                        <div id="milestones" className="section-header">
                          <h5>
                            Milestones
                            {milestonesTotal && ` (${milestonesTotal})`}
                          </h5>

                          <span>
                            {campaign.projectId > 0 &&
                              campaign.isActive &&
                              (userIsOwner || currentUser) && (
                                <Link
                                  className="btn btn-primary"
                                  to={`/campaigns/${campaign.id}/milestones/${
                                    userIsOwner ? 'new' : 'propose'
                                  }`}
                                >
                                  Create New
                                </Link>
                              )}

                            {campaign.isActive && (
                              <span className="ml-2">
                                <DonateButton
                                  model={{
                                    type: Campaign.type,
                                    title: campaign.title,
                                    id: campaign.id,
                                    adminId: campaign.projectId,
                                    token: { symbol: config.nativeTokenName },
                                  }}
                                  currentUser={currentUser}
                                  history={history}
                                />
                              </span>
                            )}
                          </span>
                        </div>

                        {isLoadingMilestones && milestonesTotal === 0 && (
                          <Loader className="relative" />
                        )}
                        <div className="milestone-cards-grid-container">
                          {milestones.map(m => (
                            <MilestoneCard
                              milestone={m}
                              currentUser={currentUser}
                              key={m._id}
                              history={history}
                              balance={balance}
                              removeMilestone={() => this.removeMilestone(m._id)}
                            />
                          ))}
                        </div>

                        {milestonesLoaded < milestonesTotal && (
                          <div className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-info"
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row spacer-top-50 spacer-bottom-50">
                    <div className="col-md-8 m-auto" />
                  </div>
                  <div className="row spacer-top-50 spacer-bottom-50">
                    <div className="col-md-8 m-auto">
                      <h4>Campaign Reviewer</h4>
                      {campaign && campaign.reviewer && (
                        <Link to={`/profile/${campaign.reviewerAddress}`}>
                          {getUserName(campaign.reviewer)}
                        </Link>
                      )}
                      {(!campaign || !campaign.reviewer) && <span>Unknown user</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </HelmetProvider>
    );
  }
}

ViewCampaign.propTypes = {
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
  balance: PropTypes.instanceOf(BigNumber),
};

ViewCampaign.defaultProps = {
  currentUser: undefined,
  balance: new BigNumber(0),
};

export default ViewCampaign;
