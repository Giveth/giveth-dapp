import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Balances from 'components/Balances';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { Button, Input, Row, Col } from 'antd';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import debounce from 'lodash.debounce';

import Loader from '../Loader';
import TraceCard from '../TraceCard';
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
import { Context as Web3Context } from '../../contextProviders/Web3Provider';

import DescriptionRender from '../DescriptionRender';

import Donation from '../../models/Donation';
import Campaign from '../../models/Campaign';
import CampaignService from '../../services/CampaignService';

import ErrorPopup from '../ErrorPopup';
import ErrorBoundary from '../ErrorBoundary';
import config from '../../configuration';
import NotFound from './NotFound';
import ProjectViewActionAlert from '../projectViewActionAlert';
import GoBackSection from '../GoBackSection';
import ErrorHandler from '../../lib/ErrorHandler';
import ProjectSubscription from '../ProjectSubscription';
import SearchAnimation from '../../assets/search-file.json';

/**
 * The Campaign detail view mapped to /campaing/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param balance      User's current balance
 */

const helmetContext = {};

const ViewCampaign = ({ match }) => {
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [isLoading, setLoading] = useState(true);
  const [isLoadingTraces, setLoadingTraces] = useState(true);
  const [isLoadingFromScratch, setLoadingFromScratch] = useState(false);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [aggregateDonations, setAggregateDonations] = useState([]);
  const [traces, setTraces] = useState([]);
  const [tracesTotal, setTracesTotal] = useState(0);
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [aggregateDonationsTotal, setAggregateDonationsTotal] = useState(0);
  const [newDonations, setNewDonations] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [campaign, setCampaign] = useState({});
  const [searchPhrase, setSearchPhrase] = useState('');

  const donationsObserver = useRef();
  const debouncedSearch = useRef();

  const donationsPerBatch = 5;
  const tracesPerBatch = 12;

  const loadMoreAggregateDonations = (
    loadFromScratch = false,
    donationsBatch = donationsPerBatch,
  ) => {
    setLoadingDonations(true);
    AggregateDonationService.get(
      campaign.id,
      donationsBatch,
      loadFromScratch ? 0 : aggregateDonations.length,
      (_donations, _donationsTotal) => {
        let nDonations;
        if (loadFromScratch) {
          nDonations = _donations.map(item => {
            const _item = aggregateDonations.find(
              element => element._id === item._id && _item.totalAmount !== item.totalAmount,
            );
            if (_item) {
              item.isNew = true;
              return item;
            }
            return item;
          });
        }
        setAggregateDonations(loadFromScratch ? nDonations : aggregateDonations.concat(_donations));
        setAggregateDonationsTotal(_donationsTotal || 0);
        setLoadingDonations(false);
      },
      err => {
        setLoadingDonations(false);
        ErrorHandler(err, 'Some error on fetching campaign donations, please try later');
      },
    );
  };

  const loadMoreTraces = (loadFromScratch = false, query) => {
    setLoadingTraces(true);
    CampaignService.getTraces(
      campaign.id,
      query || searchPhrase,
      tracesPerBatch,
      loadFromScratch ? 0 : traces.length,
      (_traces, _tracesTotal) => {
        const newTraces = loadFromScratch ? _traces : traces.concat(_traces);
        setTraces(newTraces);
        setLoadingTraces(false);
        setLoadingFromScratch(false);
        setTracesTotal(_tracesTotal);
      },
      err => {
        setLoadingTraces(false);
        ErrorHandler(err, 'Some error on fetching campaign traces, please try later');
      },
    );
  };

  const loadDonations = campaignId => {
    if (campaignId) {
      CampaignService.getDonations(
        campaignId,
        0,
        0,
        (_donations, _donationsTotal) => {
          setDonationsTotal(_donationsTotal);
        },
        err => {
          ErrorHandler(err, 'Some error on fetching campaign donations, please try later');
        },
        Donation.COMMITTED,
      );
    }
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
        setCampaign(_campaign);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
      });
  }, [donationsTotal]);

  useEffect(() => {
    if (campaign.id && !debouncedSearch.current) {
      debouncedSearch.current = debounce(query => loadMoreTraces(true, query), 1000);
    }
    if (campaign.id && donationsObserver.current === undefined) {
      loadMoreTraces(true);
      loadDonations(campaign.id);
      loadMoreAggregateDonations(true);
      // subscribe to donation count
      donationsObserver.current = CampaignService.subscribeNewDonations(
        campaign.id,
        _newDonations => {
          setNewDonations(_newDonations);
          if (_newDonations > 0) {
            loadDonations(campaign.id);
            loadMoreAggregateDonations(true);
          }
        },
        () => setNewDonations(0),
      );
    }

    return () => {
      if (donationsObserver.current) {
        donationsObserver.current.unsubscribe();
        donationsObserver.current = null;
      }
    };
  }, [campaign]);

  useEffect(() => {
    // Skip initial render
    if (campaign.id) {
      debouncedSearch.current(searchPhrase);
      setLoadingFromScratch(true);
      setLoadingTraces(true);
    }
  }, [searchPhrase]);

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

  const gotoCreateTrace = () => {
    history.push(`/campaign/${campaign.slug}/new`);
  };

  if (notFound) {
    return <NotFound projectType="Campaign" />;
  }

  if (!isLoading && !campaign) return <p>Unable to find a campaign</p>;

  const userAddress = currentUser.address;
  const ownerAddress = campaign && campaign.ownerAddress;
  const userIsOwner = userAddress && userAddress === ownerAddress;

  const leaderBoardTitle = `Leaderboard${
    aggregateDonationsTotal ? ` (${aggregateDonationsTotal})` : ''
  }`;
  const tracesTitle = `Traces${tracesTotal ? ` (${tracesTotal})` : ''}`;

  const goBackSectionLinks = [
    { title: 'About', inPageId: 'description' },
    {
      title: leaderBoardTitle,
      inPageId: 'donations',
    },
    { title: 'Funding', inPageId: 'funding' },
    {
      title: tracesTitle,
      inPageId: 'traces',
    },
  ];

  return (
    <HelmetProvider context={helmetContext}>
      <UserConsumer>
        {({ state: { userIsCommunityOwner } }) => (
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
                    adminId={campaign.projectId}
                    projectType="Campaign"
                    editProject={
                      userIsOwner &&
                      (() =>
                        isForeignNetwork
                          ? editCampaign(campaign.id)
                          : displayForeignNetRequiredWarning())
                    }
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
                          autoPopup
                          className="header-donate"
                          size="large"
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

                  <div className="container mt-4">
                    <div>
                      <div>
                        <h5 className="title">Subscribe to updates </h5>
                        <ProjectSubscription projectTypeId={campaign._id} projectType="campaign" />
                      </div>

                      {userIsCommunityOwner && (
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
                      <Row justify="space-between" className="spacer-bottom-16">
                        <Col span={12} className="align-items-center d-flex">
                          <h5 className="mb-0">{leaderBoardTitle}</h5>
                          {newDonations > 0 && (
                            <span
                              className="badge badge-primary ml-4"
                              style={{ fontSize: '12px', padding: '6px' }}
                            >
                              {newDonations} NEW
                            </span>
                          )}
                        </Col>
                        <Col span={12}>
                          {campaign.isActive && (
                            <Row gutter={[16, 16]} justify="end">
                              <Col xs={24} sm={12} lg={8}>
                                <DonateButton
                                  model={{
                                    type: Campaign.type,
                                    title: campaign.title,
                                    id: campaign.id,
                                    adminId: campaign.projectId,
                                    customThanksMessage: campaign.customThanksMessage,
                                    token: { symbol: config.nativeTokenName },
                                  }}
                                  size="large"
                                />
                              </Col>
                            </Row>
                          )}
                        </Col>
                      </Row>
                      <LeaderBoard
                        aggregateDonations={aggregateDonations}
                        isLoading={isLoadingDonations}
                        total={aggregateDonationsTotal}
                        loadMore={loadMoreAggregateDonations}
                        newDonations={newDonations}
                      />
                    </div>

                    <div id="funding" className="spacer-top-50">
                      <Row justify="space-between" className="spacer-bottom-16">
                        <Col lg={4}>
                          <h5>Funding</h5>
                        </Col>
                        <Col xs={24} lg={20}>
                          <Row gutter={[16, 16]} justify="end">
                            <Col xs={24} md={13} lg={12} xl={10}>
                              <Button
                                onClick={() => downloadCsv(campaign.id)}
                                loading={downloadingCsv}
                                block
                                size="large"
                              >
                                Download this Campaign&apos;s Financial History
                              </Button>
                            </Col>
                            {campaign.isActive && (
                              <Fragment>
                                {userIsCommunityOwner && (
                                  <Col xs={12} md={7} lg={7} xl={5}>
                                    <DelegateMultipleButton size="large" campaign={campaign} />
                                  </Col>
                                )}
                                <Col xs={12} md={4} lg={5}>
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
                                    size="large"
                                  />
                                </Col>
                              </Fragment>
                            )}
                          </Row>
                        </Col>
                      </Row>
                      <Balances entity={campaign} />
                    </div>

                    <Row justify="space-between" className="spacer-bottom-50 spacer-top-50">
                      <h5>Campaign Reviewer</h5>
                      {campaign && campaign.reviewer && (
                        <Link to={`/profile/${campaign.reviewerAddress}`}>
                          {getUserName(campaign.reviewer)}
                        </Link>
                      )}
                      {(!campaign || !campaign.reviewer) && <span>Unknown user</span>}
                    </Row>

                    <div id="traces" className="spacer-bottom-50 spacer-top-50">
                      <Row justify="space-between" className="spacer-bottom-16">
                        <Col lg={8}>
                          <h5>{tracesTitle}</h5>
                        </Col>
                        <Col xs={24} lg={16}>
                          <Row gutter={[16, 16]}>
                            {campaign.projectId > 0 && (
                              <Col xs={24} sm={12}>
                                <div className="customSearchBox">
                                  <Input
                                    className="pr-5"
                                    placeholder="Search Traces ..."
                                    size="large"
                                    value={searchPhrase}
                                    onChange={query => {
                                      setSearchPhrase(query.target.value);
                                    }}
                                  />
                                  <div>
                                    <CloseOutlined
                                      className={!searchPhrase ? 'd-none' : ''}
                                      onClick={() => setSearchPhrase('')}
                                    />
                                    <SearchOutlined
                                      className={searchPhrase ? 'd-none' : ''}
                                      onClick={() => {
                                        loadMoreTraces(true);
                                        setLoadingFromScratch(true);
                                      }}
                                    />
                                  </div>
                                </div>
                              </Col>
                            )}

                            {campaign.projectId > 0 &&
                              campaign.isActive &&
                              (userIsOwner || currentUser) && (
                                <Col xs={12} sm={6}>
                                  <Button
                                    type="primary"
                                    onClick={gotoCreateTrace}
                                    block
                                    size="large"
                                  >
                                    Create New
                                  </Button>
                                </Col>
                              )}

                            {campaign.isActive && (
                              <Col xs={12} sm={6}>
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
                                  size="large"
                                />
                              </Col>
                            )}
                          </Row>
                        </Col>
                      </Row>

                      {((tracesTotal === 0 && !isLoadingTraces) ||
                        (isLoadingFromScratch && isLoadingTraces)) && (
                        <div className="text-center mb-5 pb-5 pt-4">
                          <Lottie
                            animationData={SearchAnimation}
                            className="m-auto"
                            loop={false}
                            style={{ width: '250px' }}
                            autoplay={isLoadingTraces}
                          />
                          {!isLoadingTraces &&
                            (searchPhrase ? (
                              <Fragment>
                                <h3 style={{ color: '#2C0B3F' }}>No results found</h3>
                                <p
                                  style={{
                                    fontSize: '18px',
                                    fontFamily: 'Lato',
                                    color: '#6B7087',
                                  }}
                                >
                                  We couldn’t find any matches for your search or it doesn’t exist.
                                  <br />
                                  Try adjusting your search.
                                </p>
                              </Fragment>
                            ) : (
                              <Fragment>
                                <h3 style={{ color: '#2C0B3F' }}>No trace in here!</h3>
                              </Fragment>
                            ))}
                        </div>
                      )}

                      {!isLoadingFromScratch && (
                        <div className="trace-cards-grid-container">
                          {traces.map(t => (
                            <TraceCard trace={t} key={t._id} history={history} />
                          ))}
                        </div>
                      )}

                      {traces.length < tracesTotal && !isLoadingFromScratch && (
                        <div className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-info"
                            onClick={() => loadMoreTraces()}
                            disabled={isLoadingTraces}
                          >
                            {isLoadingTraces && (
                              <span>
                                <i className="fa fa-circle-o-notch fa-spin" /> Loading
                              </span>
                            )}
                            {!isLoadingTraces && <span>Load More</span>}
                          </button>
                        </div>
                      )}
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
