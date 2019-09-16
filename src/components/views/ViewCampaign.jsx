import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import BigNumber from 'bignumber.js';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Balances from 'components/Balances';
import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneCard from '../MilestoneCard';
import GoBackButton from '../GoBackButton';
import { isOwner, getUserName, getUserAvatar, history } from '../../lib/helpers';
import { checkBalance } from '../../lib/middleware';
import { load3BoxPublicProfile } from '../../lib/boxProfile';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import CommunityButton from '../CommunityButton';
import DelegateMultipleButton from '../DelegateMultipleButton';
import ChangeOwnershipButton from '../ChangeOwnershipButton';
import ListDonations from '../ListDonations';

import User from '../../models/User';
import Campaign from '../../models/Campaign';
import CampaignService from '../../services/CampaignService';

import ErrorPopup from '../ErrorPopup';
import ErrorBoundary from '../ErrorBoundary';
import ShareOptions from '../ShareOptions';
import config from '../../configuration';

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
      milestonesPerBatch: 50,
      donationsTotal: 0,
      donationsPerBatch: 50,
      newDonations: 0,
      ownerBoxProfile: undefined,
      reviewerBoxProfile: undefined,
    };

    this.loadMoreMilestones = this.loadMoreMilestones.bind(this);
    this.loadMoreDonations = this.loadMoreDonations.bind(this);
  }

  componentDidMount() {
    const campaignId = this.props.match.params.id;

    CampaignService.get(campaignId)
      .then(campaign => {
        this.setState({ campaign, isLoading: false });

        load3BoxPublicProfile(campaign.owner.address).then(ownerBoxProfile => {
          this.setState({ ownerBoxProfile });
        });

        if (campaign.reviewer) {
          load3BoxPublicProfile(campaign.reviewerAddress).then(reviewerBoxProfile => {
            this.setState({ reviewerBoxProfile });
          });
        }
      })
      .catch(err => {
        ErrorPopup('Something went wrong loading Campaign. Please try refresh the page.', err);
        this.setState({ isLoading: false });
      }); // TODO: inform user of error

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
    return ReactHtmlParser(this.state.campaign.description, {
      transform(node, index) {
        if (node.attribs && node.attribs.class === 'ql-video') {
          const url = node.attribs.src;
          const match =
            url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtube\.com\/([a-zA-Z0-9_-]+)/) ||
            url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
            url.match(/^(https?):\/\/(?:(?:fame)\.)?giveth\.io\/([a-zA-Z0-9_-]+)/);
          if (match) {
            return (
              <div className="video-wrapper" key={index}>
                {convertNodeToElement(node, index)}
              </div>
            );
          }
          return (
            <video width="100%" height="auto" controls name="media">
              <source src={node.attribs.src} type="video/webm" />
            </video>
          );
        }
        if (node.name === 'img') {
          return (
            <img key="" style={{ height: 'auto', width: '100%' }} alt="" src={node.attribs.src} />
          );
        }
        return undefined;
      },
    });
  }

  render() {
    const { currentUser, balance } = this.props;
    const { campaignUrl } = config;
    const {
      isLoading,
      campaign,
      ownerBoxProfile,
      reviewerBoxProfile,
      milestones,
      donations,
      isLoadingDonations,
      isLoadingMilestones,
      milestonesLoaded,
      milestonesTotal,
      donationsTotal,
      newDonations,
    } = this.state;

    if (!isLoading && !campaign) return <p>Unable to find a campaign</p>;
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
                >
                  <h6>Campaign</h6>
                  <h1>{campaign.title}</h1>
                  {campaign.owner &&
                    currentUser &&
                    campaign.owner.address === currentUser.address &&
                    campaign.isActive && (
                      <button
                        type="button"
                        className="btn btn-success"
                        style={{ marginRight: 10 }}
                        onClick={() => this.editCampaign(campaign.id)}
                      >
                        <i className="fa fa-edit" />
                        &nbsp;Edit
                      </button>
                    )}
                  <DonateButton
                    model={{
                      type: Campaign.type,
                      title: campaign.title,
                      id: campaign.id,
                      adminId: campaign.projectId,
                    }}
                    currentUser={currentUser}
                    history={history}
                  />
                  {currentUser && (
                    <DelegateMultipleButton
                      style={{ padding: '10px 10px' }}
                      campaign={campaign}
                      balance={balance}
                      currentUser={currentUser}
                    />
                  )}
                  {campaign.owner &&
                    currentUser &&
                    campaign.owner.address === currentUser.address &&
                    campaign.isActive && (
                      <ChangeOwnershipButton
                        campaign={campaign}
                        balance={balance}
                        currentUser={currentUser}
                        {...this.props}
                      />
                    )}

                  {campaign.communityUrl && (
                    <CommunityButton className="btn btn-secondary" url={campaign.communityUrl}>
                      Join our Community
                    </CommunityButton>
                  )}
                </BackgroundImageHeader>

                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-8 m-auto">
                      <div className="go-back-section">
                        <GoBackButton to="/" title="Campaigns" />
                        <ShareOptions pageUrl={window.location.href} pageTitle={campaign.title} />
                      </div>

                    <center>
                      <Link to={`/profile/${campaign.owner.address}`}>
                        <Avatar
                          size={50}
                          src={
                            ownerBoxProfile ? ownerBoxProfile.avatar : getUserAvatar(campaign.owner)
                          }
                          round
                        />
                        <p className="small">
                          {ownerBoxProfile ? ownerBoxProfile.name : getUserName(campaign.owner)}
                        </p>
                      </Link>
                    </center>

                      <div className="card content-card ">
                        <div className="card-body content">{this.renderDescription()}</div>
                      </div>

                      <div className="milestone-header spacer-top-50 card-view">
                        <h3>Milestones</h3>
                        {campaign.projectId > 0 && isOwner(campaign.owner.address, currentUser) && (
                          <Link
                            className="btn btn-primary btn-sm pull-right"
                            to={`/campaigns/${campaign.id}/milestones/new`}
                          >
                            Add Milestone
                          </Link>
                        )}

                        {campaign.projectId > 0 &&
                          !isOwner(campaign.owner.address, currentUser) &&
                          currentUser && (
                            <Link
                              className="btn btn-primary btn-sm pull-right"
                              to={`/campaigns/${campaign.id}/milestones/propose`}
                            >
                              Propose Milestone
                            </Link>
                          )}

                        {isLoadingMilestones && milestonesTotal === 0 && (
                          <Loader className="relative" />
                        )}
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
                                balance={balance}
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
                      <Balances entity={campaign} />

                      <ListDonations
                        donations={donations}
                        isLoading={isLoadingDonations}
                        total={donationsTotal}
                        loadMore={this.loadMoreDonations}
                        newDonations={newDonations}
                      />
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
                    </div>
                  </div>
                </div>
                <div className="row spacer-top-50 spacer-bottom-50">
                  <div className="col-md-8 m-auto">
                    <h4>Campaign Reviewer</h4>
                    {campaign && campaign.reviewer && (
                      <Link to={`/profile/${campaign.reviewerAddress}`}>
                        {reviewerBoxProfile
                          ? reviewerBoxProfile.name
                          : getUserName(campaign.reviewer)}
                      </Link>
                    )}
                    {(!campaign || !campaign.reviewer) && <span>Unknown user</span>}
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
