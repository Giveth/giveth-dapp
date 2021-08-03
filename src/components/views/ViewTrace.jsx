import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';

import Campaign from 'models/Campaign';
import Trace from 'models/Trace';
import LPTrace from 'models/LPTrace';

import BackgroundImageHeader from 'components/BackgroundImageHeader';
import DonateButton from 'components/DonateButton';
import Loader from 'components/Loader';
import TraceItem from 'components/TraceItem';
import DonationList from 'components/DonationList';
import TraceConversations from 'components/TraceConversations';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Col, Row } from 'antd';
import {
  convertEthHelper,
  getReadableStatus,
  getUserAvatar,
  getUserName,
  history,
} from '../../lib/helpers';
import TraceService from '../../services/TraceService';
import CommunityService from '../../services/CommunityService';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import NotFound from './NotFound';
import DescriptionRender from '../DescriptionRender';
import ErrorBoundary from '../ErrorBoundary';
import EditTraceButton from '../EditTraceButton';
import GoBackSection from '../GoBackSection';
import ViewTraceAlerts from '../ViewTraceAlerts';
import CancelTraceButton from '../CancelTraceButton';
import DeleteProposedTraceButton from '../DeleteProposedTraceButton';
import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import ErrorHandler from '../../lib/ErrorHandler';
import ProjectSubscription from '../ProjectSubscription';
import TotalGasPaid from './TotalGasPaid';
import config from '../../configuration';

/**
 Loads and shows a single trace

 @route params:
 traceId (string): id of a trace
 * */

const helmetContext = {};

const ViewTrace = props => {
  const {
    actions: { convertMultipleRates },
  } = useContext(ConversionRateContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { nativeCurrencyWhitelist, activeTokenWhitelist, minimumPayoutUsdValue },
  } = useContext(WhiteListContext);

  const [isLoading, setLoading] = useState(true);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [donations, setDonations] = useState([]);
  const [recipient, setRecipient] = useState({});
  const [campaign, setCampaign] = useState({});
  const [trace, setTrace] = useState({});
  const [communityTitle, setCommunityTitle] = useState('');
  const [newDonations, setNewDonations] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [isAmountEnoughForWithdraw, setIsAmountEnoughForWithdraw] = useState(true);
  const [currency, setCurrency] = useState(null);
  const [currentBalanceValue, setCurrentBalanceValue] = useState(0);
  const [currentBalanceUsdValue, setCurrentBalanceUsdValue] = useState(0);

  const donationsObserver = useRef();
  const traceSubscription = useRef();
  const donationsPerBatch = 50;

  const getCommunityTitle = async communityId => {
    if (communityId === 0) return;
    CommunityService.getByDelegateId(communityId)
      .then(community => setCommunityTitle(community.title))
      .catch(() => {});
  };

  function loadMoreDonations(loadFromScratch = false, donationsBatch = donationsPerBatch) {
    setLoadingDonations(true);
    TraceService.getDonations(
      trace.id,
      donationsBatch,
      loadFromScratch ? 0 : donations.length,
      (_donations, _donationsTotal) => {
        setDonations(loadFromScratch ? _donations : donations.concat(_donations));
        setLoadingDonations(false);
      },
      err => {
        setLoadingDonations(false);
        ErrorHandler(err, 'Some error on fetching trace donations, please try later');
      },
    );
  }

  const cleanTraceSubscription = () => {
    if (traceSubscription.current) {
      traceSubscription.current.unsubscribe();
      traceSubscription.current = undefined;
    }
  };

  useEffect(() => {
    const { traceId, traceSlug } = props.match.params;

    traceSubscription.current = TraceService.subscribeOne(
      traceId,
      _trace => {
        if (traceId) {
          history.push(`/trace/${_trace.slug}`);
        }
        setTrace(_trace);
        setRecipient(_trace.pendingRecipientAddress ? _trace.pendingRecipient : _trace.recipient);
        // Stop unnecessary updates on subscribe
        if (!campaign.id) {
          setCampaign(new Campaign(_trace.campaign));
          getCommunityTitle(_trace.communityId);
          setLoading(false);
        }
      },
      () => {
        setNotFound(true);
      },
      traceSlug,
    );

    return cleanTraceSubscription;
  }, []);

  useEffect(() => {
    if (trace.id) {
      loadMoreDonations(true);

      // subscribe to donation count
      donationsObserver.current = TraceService.subscribeNewDonations(
        trace.id,
        _newDonations => {
          setNewDonations(_newDonations);
          if (_newDonations > 0) {
            loadMoreDonations(true);
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
  }, [trace]);

  const calculateTraceCurrentBalanceValue = async () => {
    setCurrency(currentUser.currency);
    try {
      const rateArray = trace.donationCounters.map(dc => {
        return {
          value: dc.currentBalance,
          currency: dc.symbol,
        };
      });
      const userCurrencyValueResult = await convertMultipleRates(
        null,
        currentUser.currency,
        rateArray,
      );
      setCurrentBalanceValue(userCurrencyValueResult.total);
      setCurrentBalanceUsdValue(userCurrencyValueResult.usdValues);
    } catch (e) {
      console.log('convertMultipleRates error', e);
    }
  };

  useEffect(() => {
    if (currentUser.address && trace.donationCounters && trace.donationCounters.length) {
      calculateTraceCurrentBalanceValue().then();
    }
  }, [currentUser.address, trace]);

  useEffect(() => {
    if (!currentBalanceUsdValue) {
      return;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const currencyUsdValue of currentBalanceUsdValue) {
      // if usdValue is zero we should not set setIsAmountEnoughForWithdraw(false) because we check
      // minimumPayoutUsdValue comparison when usdValue for a currency is not zero
      if (currencyUsdValue.usdValue && currencyUsdValue.usdValue < minimumPayoutUsdValue) {
        setIsAmountEnoughForWithdraw(false);
        return;
      }
    }
    setIsAmountEnoughForWithdraw(true);
  }, [currentBalanceUsdValue]);

  const isActiveTrace = () => {
    const { fullyFunded, status } = trace;
    return status === Trace.IN_PROGRESS && !fullyFunded;
  };

  const renderDescription = () => DescriptionRender(trace.description);

  const renderTitleHelper = () => {
    if (trace.isCapped) {
      if (!trace.fullyFunded) {
        return (
          <p>
            Amount requested: {convertEthHelper(trace.maxAmount, trace.token.decimals)}{' '}
            {trace.token.symbol}
          </p>
        );
      }
      return <p>This Trace has reached its funding goal!</p>;
    }

    // Trace is uncap
    if (trace.acceptsSingleToken) {
      return <p>This trace accepts only {trace.token.symbol}</p>;
    }

    const symbols = activeTokenWhitelist.map(t => t.symbol);
    switch (symbols.length) {
      case 0:
        return <p>No token is defined to contribute.</p>;
      case 1:
        return <p>This Trace accepts only ${symbols}</p>;

      default: {
        const symbolsStr = `${symbols.slice(0, -1).join(', ')} or ${symbols[symbols.length - 1]}`;
        return <p>This Trace accepts {symbolsStr}</p>;
      }
    }
  };

  if (notFound) {
    return <NotFound projectType="Trace" />;
  }

  const donationsTitle = `Donations${donations.length ? ` (${donations.length})` : ''}`;

  const goBackSectionLinks = [
    { title: 'About', inPageId: 'description' },
    { title: 'Details', inPageId: 'details' },
    { title: 'Status Updates', inPageId: 'status-updates' },
    {
      title: donationsTitle,
      inPageId: 'donations',
    },
  ];
  if (trace.items && trace.items.length) {
    goBackSectionLinks.push({ title: 'Proofs', inPageId: 'proofs' });
  }

  const DetailLabel = ({ id, title, explanation }) => (
    <div>
      <span className="label">
        {title}
        <i
          className="fa fa-question-circle-o btn btn-sm btn-explain"
          data-tip="React-tooltip"
          data-for={id}
        />
      </span>
      <ReactTooltip id={id} place="top" type="dark" effect="solid">
        {explanation}
      </ReactTooltip>
    </div>
  );

  DetailLabel.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    explanation: PropTypes.string.isRequired,
  };

  const donateButtonProps = {
    model: {
      type: Trace.type,
      acceptsSingleToken: trace.acceptsSingleToken,
      slug: trace.slug,
      formType: trace.formType,
      title: trace.title,
      id: trace.id,
      adminId: trace.projectId,
      communityId: trace.communityId,
      campaignId: campaign._id,
      token: trace.acceptsSingleToken ? trace.token : undefined,
      isCapped: trace.isCapped,
      ownerAddress: trace.ownerAddress,
    },
    maxDonationAmount: trace.isCapped
      ? trace.maxAmount.minus(trace.totalDonatedSingleToken)
      : undefined,
  };

  const detailsCardElmnt = document.getElementById('detailsCard');
  const detailsCardHeight = detailsCardElmnt && detailsCardElmnt.offsetHeight;

  const fullPath = config.homeUrl + props.match.url;

  return (
    <HelmetProvider context={helmetContext}>
      <ErrorBoundary>
        <div id="view-trace-view">
          {isLoading && <Loader className="fixed" />}

          {!isLoading && (
            <div>
              <Helmet>
                <title>{trace.title}</title>
              </Helmet>

              <BackgroundImageHeader image={trace.image} adminId={trace.projectId}>
                <h6>TRACE</h6>
                <h1>{trace.title}</h1>

                {!trace.status === Trace.IN_PROGRESS && <p>This Trace is not active anymore</p>}

                {renderTitleHelper()}

                <p>Campaign: {campaign.title} </p>

                <EditTraceButton
                  trace={trace}
                  className="m-1 ghostButtonHeader btn-sm btn-primary"
                />
                <CancelTraceButton trace={trace} className="m-1 ghostButtonHeader" />
                <DeleteProposedTraceButton trace={trace} className="m-1 ghostButtonHeader" />

                {isActiveTrace() && trace.ownerAddress !== currentUser.address && (
                  <div className="mt-4">
                    <DonateButton
                      {...donateButtonProps}
                      size="large"
                      autoPopup
                      className="header-donate"
                    />
                  </div>
                )}
              </BackgroundImageHeader>

              <GoBackSection
                projectTitle={trace.title}
                backUrl={`/campaign/${campaign.slug}`}
                backButtonTitle={`Campaign: ${campaign.title}`}
                inPageLinks={goBackSectionLinks}
              />

              <div className=" col-md-8 m-auto">
                <h5 className="title">Subscribe to updates </h5>
                <ProjectSubscription projectTypeId={trace._id} projectType="trace" />
              </div>

              <div className="container-fluid mt-4">
                <div className="row">
                  <div className="col-md-8 m-auto">
                    <ViewTraceAlerts
                      trace={trace}
                      campaign={campaign}
                      isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
                    />

                    <div id="description">
                      <div className="about-section-header">
                        <h5 className="title">About</h5>
                        <div className="text-center">
                          <Link to={`/profile/${trace.ownerAddress}`}>
                            <Avatar
                              className="text-center"
                              size={50}
                              src={getUserAvatar(trace.owner)}
                              round
                            />
                            <p className="small">{getUserName(trace.owner)}</p>
                          </Link>
                        </div>
                      </div>

                      <div className="card content-card">
                        <div className="card-body content">{renderDescription()}</div>
                      </div>
                    </div>

                    <div className="row">
                      <div id="details" className="col-md-6">
                        <h4>Details</h4>
                        <div id="detailsCard">
                          <div className="card details-card">
                            <div className="form-group">
                              <DetailLabel
                                id="reviewer"
                                title="Reviewer"
                                explanation="This person will review the actual completion of the Trace"
                              />
                              {trace.hasReviewer && (
                                <Fragment>
                                  <table className="table-responsive">
                                    <tbody>
                                      <tr>
                                        <td className="td-user">
                                          <Link to={`/profile/${trace.reviewerAddress}`}>
                                            <Avatar
                                              size={30}
                                              src={getUserAvatar(trace.reviewer)}
                                              round
                                            />
                                            {getUserName(trace.reviewer)}
                                          </Link>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </Fragment>
                              )}
                              {!trace.hasReviewer && (
                                <p className="form-text alert alert-warning missing-reviewer-alert">
                                  <i className="fa fa-exclamation-triangle" />
                                  This Trace does not have a reviewer. Any donations to this Trace
                                  can be withdrawn at any time and no checks are in place to ensure
                                  this Trace is completed.
                                </p>
                              )}
                            </div>

                            <div className="form-group">
                              <DetailLabel
                                id="recipient"
                                title="Recipient"
                                explanation={`
                          Where the ${trace.isCapped ? trace.token.symbol : 'tokens'} will go
                          ${trace.hasReviewer ? ' after successful completion of the Trace' : ''}`}
                              />
                              {trace.hasRecipient && (
                                <Fragment>
                                  {trace.pendingRecipientAddress && (
                                    <small className="form-text">
                                      <span>
                                        <i className="fa fa-circle-o-notch fa-spin" />
                                        &nbsp;
                                      </span>
                                      This recipient is pending
                                    </small>
                                  )}

                                  <table className="table-responsive">
                                    <tbody>
                                      <tr>
                                        <td className="td-user">
                                          {trace instanceof LPTrace ? (
                                            <Link to={`/campaigns/${trace.recipient._id}`}>
                                              Campaign: {trace.recipient.title}
                                            </Link>
                                          ) : (
                                            <Link
                                              to={`/profile/${trace.pendingRecipientAddress ||
                                                trace.recipientAddress}`}
                                            >
                                              <Avatar
                                                size={30}
                                                src={getUserAvatar(recipient)}
                                                round
                                              />
                                              {getUserName(recipient)}
                                            </Link>
                                          )}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </Fragment>
                              )}
                              {!trace.hasRecipient && (
                                <p className="form-text">
                                  This Trace does not have a recipient. If you are interested in
                                  completing the work for this Trace, contact the Trace manager and
                                  let them know!
                                </p>
                              )}
                            </div>

                            {trace.communityId !== 0 && trace.communityId !== undefined && (
                              <div className="form-group">
                                <DetailLabel
                                  id="community-delegation"
                                  title="Delegating 3% to Community"
                                  explanation="The Community that this Trace is contributing to on every donation"
                                />
                                {communityTitle}
                              </div>
                            )}
                            {trace.date && (
                              <div className="form-group">
                                <DetailLabel
                                  id="trace-date"
                                  title="Date of Trace"
                                  explanation={
                                    trace.isCapped
                                      ? `This date defines the ${trace.token.symbol}-fiat conversion rate`
                                      : 'The date this Trace was created'
                                  }
                                />
                                {moment.utc(trace.createdAt).format('Do MMM YYYY')}
                              </div>
                            )}

                            {trace.isCapped && (
                              <div className="form-group">
                                <DetailLabel
                                  id="max-amount"
                                  title="Max amount to raise"
                                  explanation={`The maximum amount of ${trace.token.symbol} that can be donated to this Trace. Based on the requested amount in fiat.`}
                                />
                                {convertEthHelper(trace.maxAmount, trace.token.decimals)}{' '}
                                {trace.token.symbol}
                                {trace.items.length === 0 &&
                                  trace.selectedFiatType &&
                                  trace.selectedFiatType !== trace.token.symbol &&
                                  trace.fiatAmount && (
                                    <span>
                                      {' '}
                                      ({trace.fiatAmount.toFixed()} {trace.selectedFiatType})
                                    </span>
                                  )}
                              </div>
                            )}

                            <div className="form-group">
                              <DetailLabel
                                id="amount-donated"
                                title="Amount donated"
                                explanation={
                                  trace.acceptsSingleToken
                                    ? `
                              The amount of ${trace.token.symbol} currently donated to this
                              Trace`
                                    : 'The total amount(s) donated to this Trace'
                                }
                              />
                              {trace.donationCounters.length &&
                                trace.donationCounters.map(dc => (
                                  <p className="donation-counter" key={dc.symbol}>
                                    {convertEthHelper(dc.totalDonated, dc.decimals)} {dc.symbol}
                                  </p>
                                ))}
                            </div>

                            {!trace.isCapped && trace.donationCounters.length > 0 && (
                              <div className="form-group">
                                <DetailLabel
                                  id="current-balance"
                                  title="Current balance"
                                  explanation="The current balance(s) of this Trace"
                                />
                                {trace.donationCounters.map(dc => (
                                  <p className="donation-counter" key={dc.symbol}>
                                    {convertEthHelper(dc.currentBalance, dc.decimals)} {dc.symbol}
                                  </p>
                                ))}
                              </div>
                            )}

                            {!trace.isCapped && trace.donationCounters.length > 0 && currency && (
                              <div className="form-group">
                                <DetailLabel
                                  id="current-balance-value"
                                  title="Current balance value"
                                  explanation="The current balance(s) of this Trace in your native currency"
                                />
                                {currentBalanceValue.toFixed(
                                  (nativeCurrencyWhitelist.find(t => t.symbol === currency) || {})
                                    .decimals || 2,
                                )}{' '}
                                {currency}
                              </div>
                            )}

                            <div className="form-group">
                              <DetailLabel
                                id="campaign"
                                title="Campaign"
                                explanation="The Campaign this Trace belongs to"
                              />
                              {campaign.title}
                            </div>

                            <div className="form-group">
                              <span className="label">Status</span>
                              <br />
                              {getReadableStatus(trace.status)}
                            </div>
                          </div>

                          <div className="pt-3">
                            <TotalGasPaid
                              gasPaidUsdValue={trace.gasPaidUsdValue}
                              entity="TRACE"
                              tweetUrl={fullPath}
                            />
                          </div>
                        </div>
                      </div>

                      <div id="status-updates" className="col-md-6">
                        <h4>Status updates</h4>
                        <TraceConversations
                          trace={trace}
                          isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
                          maxHeight={`${detailsCardHeight}px`}
                        />
                      </div>
                    </div>

                    {trace.items && trace.items.length > 0 && (
                      <div id="proofs" className="spacer-top-50">
                        <div className="section-header">
                          <h5>Trace proof</h5>
                        </div>
                        <div>
                          <p>These receipts show how the money of this Trace was spent.</p>
                        </div>

                        <div className="table-container">
                          <table className="table table-striped table-hover">
                            <thead>
                              <tr>
                                <th className="td-item-date">Date</th>
                                <th className="td-item-description">Description</th>
                                <th className="td-item-amount-fiat">Amount Fiat</th>
                                <th className="td-item-amount-ether">
                                  Amount {trace.token.symbol}
                                </th>
                                <th className="td-item-file-upload">Attached proof</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trace.items.map((item, i) => (
                                <TraceItem
                                  key={item._id}
                                  name={`traceItem-${i}`}
                                  item={item}
                                  token={trace.token}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div id="donations" className="spacer-top-50">
                      {trace.status !== Trace.PROPOSED && (
                        <React.Fragment>
                          <Row justify="space-between">
                            <Col span={12} className="align-items-center d-flex">
                              <h5 className="mb-0">{donationsTitle}</h5>
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
                              {isActiveTrace() && (
                                <Row gutter={[16, 16]} justify="end">
                                  <Col xs={24} sm={12} lg={8}>
                                    <DonateButton {...donateButtonProps} />
                                  </Col>
                                </Row>
                              )}
                            </Col>
                          </Row>
                          <DonationList
                            donations={donations}
                            isLoading={isLoadingDonations}
                            total={donations.length}
                            loadMore={loadMoreDonations}
                            newDonations={newDonations}
                            useAmountRemaining
                            status={trace.status}
                          />
                        </React.Fragment>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

ViewTrace.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      traceId: PropTypes.string,
      traceSlug: PropTypes.string,
    }),
    url: PropTypes.string,
  }).isRequired,
};

export default React.memo(ViewTrace);
