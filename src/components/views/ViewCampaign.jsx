import React, { Fragment, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Balances from 'components/Balances';
import { saveAs } from 'file-saver';
import axios from 'axios';
import Loader from '../Loader';
import MilestoneCard from '../MilestoneCard';
import { getUserName, getUserAvatar, history } from '../../lib/helpers';
import { checkBalance } from '../../lib/middleware';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import CommunityButton from '../CommunityButton';
import DelegateMultipleButton from '../DelegateMultipleButton';
import ChangeOwnershipButton from '../ChangeOwnershipButton';
import LeaderBoard from '../LeaderBoard';
import AggregateDonationService from '../../services/AggregateDonationService';
import {
  Consumer as UserConsumer,
  Context as UserContext,
} from '../../contextProviders/UserProvider';

import DescriptionRender from '../DescriptionRender';

import Campaign from '../../models/Campaign';
import CampaignService from '../../services/CampaignService';

import ErrorPopup from '../ErrorPopup';
import ErrorBoundary from '../ErrorBoundary';
import config from '../../configuration';
import CreateDonationAddressButton from '../CreateDonationAddressButton';
import NotFound from './NotFound';
import ProjectViewActionAlert from '../projectViewActionAlert';
import GoBackSection from '../GoBackSection';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import ErrorHandler from '../../lib/ErrorHandler';
import ProjectSubscription from '../ProjectSubscription';

/**
 * The Campaign detail view mapped to /campaing/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param balance      User's current balance
 */

const helmetContext = {};

const ViewCampaign = ({ match }) => {
  let currentCampaign = null;
  const {
    state: { balance },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [isLoading, setLoading] = useState(true);
  const [isLoadingMilestones, setLoadingMilestones] = useState(true);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [aggregateDonations, setAggregateDonations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [milestonesTotal, setMilestonesTotal] = useState(0);
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [newDonations, setNewDonations] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [campaign, setCampaign] = useState();

  const donationsPerBatch = 5;
  const milestonesPerBatch = 12;
  let donationsObserver;

  const loadMoreAggregateDonations = () => {
    setLoadingDonations(true);
    AggregateDonationService.get(
      currentCampaign.id,
      donationsPerBatch,
      aggregateDonations.length,
      (_donations, _donationsTotal) => {
        setAggregateDonations(aggregateDonations.concat(_donations));
        setDonationsTotal(_donationsTotal || 0);
        setLoadingDonations(false);
      },
      err => {
        setLoadingDonations(false);
        ErrorHandler(err, 'Some error on fetching campaign donations, please try later');
      },
    );
  };
  const loadMoreMilestones = (campaignId = match.params.id) => {
    setLoadingMilestones(true);

    CampaignService.getMilestones(
      campaignId,
      milestonesPerBatch,
      milestones.length,
      (_milestones, _milestonesTotal) => {
        const newMilestones = milestones.concat(_milestones);
        setMilestones(newMilestones);
        setLoadingMilestones(false);
        setMilestonesTotal(_milestonesTotal);
      },
      err => {
        setLoadingMilestones(false);
        ErrorHandler(err, 'Some error on fetching campaign milestones, please try later');
      },
    );
  };

  useEffect(() => {
    const { id, slug } = match.params;
    const getFunction = slug
      ? CampaignService.getBySlug.bind(CampaignService, slug)
      : CampaignService.get.bind(CampaignService, id);

    getFunction()
      .then(_campaign => {
        if (_campaign && id) {
          history.push(`/campaign/${_campaign.slug}`);
        }
        currentCampaign = _campaign;
        setCampaign(_campaign);
        setLoading(false);
        loadMoreMilestones(_campaign.id);
        // subscribe to donation count
        donationsObserver = CampaignService.subscribeNewDonations(
          _campaign.id,
          _newDonations => setNewDonations(_newDonations),
          () => setNewDonations(0),
        );
        loadMoreAggregateDonations();
      })
      .catch(() => {
        setNotFound(true);
      });
    return () => {
      if (donationsObserver) donationsObserver.unsubscribe();
    };
  }, []);

  const downloadCsv = campaignId => {
    const url = `${config.feathersConnection}/campaigncsv/${campaignId}`;
    const fileName = `${campaignId}.csv`;
    setDownloadingCsv(true);
    const getDownloadFile = async address => {
      return axios.get(address, {
        responseType: 'blob',
      });
      // .then(response => response.blob())
    };
    getDownloadFile(url)
      .then(response => {
        setDownloadingCsv(false);
        saveAs(response.data, fileName);
      })
      .catch(err => {
        setDownloadingCsv(false);
        ErrorHandler(err, 'Some error on fetching CSV, please try later');
      });
  };

  const editCampaign = id => {
    checkBalance(balance)
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
  };

  const renderDescription = () => {
    return DescriptionRender(campaign.description);
  };

  if (notFound) {
    return <NotFound projectType="Campaign" />;
  }

  if (!isLoading && !campaign) return <p>Unable to find a campaign</p>;

  const userAddress = currentUser.address;
  const ownerAddress = campaign && campaign.ownerAddress;
  const userIsOwner = userAddress && userAddress === ownerAddress;
  const donationAddress = campaign && campaign.donationAddress;

  const showDonateAddress = donationAddress || userIsOwner;

  const leaderBoardTitle = `Leaderboard${donationsTotal ? ` (${donationsTotal})` : ''}`;
  const milestonesTitle = `Milestones${milestonesTotal ? ` (${milestonesTotal})` : ''}`;

  const goBackSectionLinks = [
    { title: 'About', inPageId: 'description' },
    {
      title: leaderBoardTitle,
      inPageId: 'donations',
    },
    { title: 'Funding', inPageId: 'funding' },
    {
      title: milestonesTitle,
      inPageId: 'milestones',
    },
  ];

  return (
    <HelmetProvider context={helmetContext}>
      <UserConsumer>
        {({ state: { userIsDacOwner } }) => (
          <ErrorBoundary>
            <div id="view-campaign-view">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  <Helmet>
                    <title>{campaign.title}</title>
                  </Helmet>

                  <BackgroundImageHeader
                    image={campaign.image}
                    height={300}
                    adminId={campaign.projectId}
                    projectType="Campaign"
                    editProject={userIsOwner && (() => editCampaign(campaign.id))}
                    cancelProject={userIsOwner && (() => {})}
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
                            customThanksMessage: campaign.customThanksMessage,
                          }}
                          currentUser={currentUser}
                          history={history}
                          autoPopup
                          className="header-donate"
                        />
                      </div>
                    )}
                  </BackgroundImageHeader>

                  <GoBackSection
                    backUrl="/campaigns"
                    backButtonTitle="Campaigns"
                    projectTitle={campaign.title}
                    inPageLinks={goBackSectionLinks}
                  />

                  <div className="container-fluid mt-4">
                    <div className="row">
                      <div className="col-md-8 m-auto">
                        <div>
                          <div>
                            <h5 className="title">Subscribe to updates </h5>
                            <ProjectSubscription
                              projectTypeId={campaign._id}
                              projectType="campaign"
                            />
                          </div>

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

                          {userIsDacOwner && (
                            <ProjectViewActionAlert message="Delegate some donation to this project">
                              <DelegateMultipleButton campaign={campaign} />
                            </ProjectViewActionAlert>
                          )}

                          {userIsOwner && (
                            <ProjectViewActionAlert message="Change Co-Owner of Campaign">
                              <ChangeOwnershipButton campaign={campaign} />
                            </ProjectViewActionAlert>
                          )}
                        </div>

                        <div id="description">
                          <div className="about-section-header">
                            <h5 className="title">About</h5>
                            <div className="text-center">
                              <Link to={`/profile/${ownerAddress}`}>
                                <Avatar size={50} src={getUserAvatar(campaign.owner)} round />
                                <p className="small">{getUserName(campaign.owner)}</p>
                              </Link>
                            </div>
                          </div>

                          <div className="card content-card ">
                            <div className="card-body content">{renderDescription()}</div>

                            {campaign.communityUrl && (
                              <div className="pl-3 pb-4">
                                <CommunityButton
                                  className="btn btn-secondary"
                                  url={campaign.communityUrl}
                                >
                                  Join our Community
                                </CommunityButton>
                              </div>
                            )}
                          </div>
                        </div>

                        <div id="donations" className="spacer-top-50">
                          <div className="section-header">
                            <h5>{leaderBoardTitle}</h5>
                            {campaign.isActive && (
                              <DonateButton
                                model={{
                                  type: Campaign.type,
                                  title: campaign.title,
                                  id: campaign.id,
                                  adminId: campaign.projectId,
                                  customThanksMessage: campaign.customThanksMessage,
                                  token: { symbol: config.nativeTokenName },
                                }}
                                currentUser={currentUser}
                                history={history}
                              />
                            )}
                          </div>
                          <LeaderBoard
                            aggregateDonations={aggregateDonations}
                            isLoading={isLoadingDonations}
                            total={donationsTotal}
                            loadMore={loadMoreAggregateDonations}
                            newDonations={newDonations}
                          />
                        </div>

                        <div id="funding" className="spacer-top-50">
                          <div className="section-header">
                            <h5>Funding</h5>
                            <span>
                              {downloadingCsv && (
                                <button
                                  type="button"
                                  className="btn btn-info disabled"
                                  onClick={() => {}}
                                >
                                  Please wait...
                                </button>
                              )}
                              {!downloadingCsv && (
                                <button
                                  type="button"
                                  className="btn btn-info"
                                  onClick={() => downloadCsv(campaign.id)}
                                >
                                  Download this Campaign&apos;s Financial History
                                </button>
                              )}
                              {campaign.isActive && (
                                <Fragment>
                                  {userIsDacOwner && (
                                    <DelegateMultipleButton
                                      campaign={campaign}
                                      balance={balance}
                                      currentUser={currentUser}
                                    />
                                  )}
                                  <DonateButton
                                    model={{
                                      type: Campaign.type,
                                      title: campaign.title,
                                      id: campaign.id,
                                      adminId: campaign.projectId,
                                      customThanksMessage: campaign.customThanksMessage,
                                      token: {
                                        symbol: config.nativeTokenName,
                                      },
                                    }}
                                    currentUser={currentUser}
                                    history={history}
                                  />
                                </Fragment>
                              )}
                            </span>
                          </div>
                          <Balances entity={campaign} currentUser={currentUser} />
                        </div>

                        <div>
                          <h5>Campaign Reviewer</h5>
                          {campaign && campaign.reviewer && (
                            <Link to={`/profile/${campaign.reviewerAddress}`}>
                              {getUserName(campaign.reviewer)}
                            </Link>
                          )}
                          {(!campaign || !campaign.reviewer) && <span>Unknown user</span>}
                        </div>

                        <div id="milestones" className="spacer-bottom-50 spacer-top-50">
                          <div className="section-header">
                            <h5>{milestonesTitle}</h5>
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
                                <span>
                                  <DonateButton
                                    model={{
                                      type: Campaign.type,
                                      title: campaign.title,
                                      id: campaign.id,
                                      adminId: campaign.projectId,
                                      customThanksMessage: campaign.customThanksMessage,
                                      token: {
                                        symbol: config.nativeTokenName,
                                      },
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
                              <MilestoneCard milestone={m} key={m._id} history={history} />
                            ))}
                          </div>

                          {milestones.length < milestonesTotal && (
                            <div className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-info"
                                onClick={() => loadMoreMilestones()}
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
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}
      </UserConsumer>
    </HelmetProvider>
  );
};

ViewCampaign.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default ViewCampaign;
