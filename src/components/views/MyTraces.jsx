import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import { Context as WhiteListContext } from 'contextProviders/WhiteListProvider';
import TraceActions from 'components/TraceActions';
import { Context as UserContext } from '../../contextProviders/UserProvider';

import AuthenticationWarning from '../AuthenticationWarning';
import ErrorPopup from '../ErrorPopup';
import Loader from '../Loader';

import {
  getTruncatedText,
  getReadableStatus,
  convertEthHelper,
  ANY_TOKEN,
} from '../../lib/helpers';
import config from '../../configuration';

import TraceService from '../../services/TraceService';
import Trace from '../../models/Trace';

const reviewDue = updatedAt =>
  moment()
    .subtract(3, 'd')
    .isAfter(moment(updatedAt));

/**
 * The my traces view
 */
const MyTraces = () => {
  const traceTabs = ['Active', 'Paid', 'Canceled', 'Rejected'];

  const [isLoading, setLoading] = useState(true);
  const [traces, setTraces] = useState([]);
  const [skipPages, setSkipPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [traceStatus, setTraceStatus] = useState(traceTabs[0]);

  const itemsPerPage = 10;
  const visiblePages = 10;

  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
  } = useContext(Web3Context);
  const {
    state: { tokenWhitelist },
  } = useContext(WhiteListContext);

  function cleanUp() {
    TraceService.unsubscribe();
  }

  const loadTraces = useCallback(() => {
    const myAddress = currentUser.address;
    if (myAddress) {
      TraceService.subscribeMyTraces({
        traceStatus,
        ownerAddress: myAddress,
        coownerAddress: myAddress,
        recipientAddress: myAddress,
        skipPages,
        itemsPerPage,
        onResult: resp => {
          setTraces(resp.data);
          setTotalResults(resp.total);
          setLoading(false);
        },
        onError: err => {
          ErrorPopup('Something went wrong.', err);
          // TODO: handle error here in view
          setLoading(false);
        },
      });
    } else {
      setTraces([]);
      setTotalResults(0);
      setLoading(false);
    }
  }, [currentUser.address, traceStatus, skipPages]);

  function getTokenSymbol(token) {
    if (token.foreignAddress === ANY_TOKEN.foreignAddress) {
      return tokenWhitelist.map(t => t.symbol).join(', ');
    }
    return token.symbol;
  }

  function handlePageChanged(newPage) {
    // Skip rerendering for same page
    if (newPage - 1 !== skipPages) {
      setLoading(true);
      setSkipPages(newPage - 1);
    }
  }

  function changeTab(newStatus) {
    // Skip rerendering for same tab
    if (newStatus !== traceStatus) {
      setLoading(true);
      setSkipPages(0);
      setTraceStatus(newStatus);
    }
  }

  useEffect(() => {
    // To skip initial render
    setLoading(true);
    loadTraces();
    return cleanUp;
  }, [currentUser.address, loadTraces, traceStatus, skipPages]);

  return (
    <div id="traces-view">
      <div className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-10 m-auto">
            <h1>Your Traces</h1>
            <ViewNetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />

            <AuthenticationWarning />

            <div className="dashboard-table-view">
              <ul className="nav nav-tabs">
                {traceTabs.map(st => (
                  <li className="nav-item" key={st}>
                    <span
                      role="button"
                      className="nav-link"
                      onKeyPress={() => changeTab(st)}
                      tabIndex={0}
                      onClick={() => changeTab(st)}
                    >
                      {st}
                    </span>
                  </li>
                ))}
              </ul>

              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div className="table-container">
                  {traces && traces.length > 0 && (
                    <div>
                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            <th className="td-actions">Actions</th>
                            <th className="td-created-at">Created</th>
                            <th className="td-name">Name</th>
                            <th className="td-status">Status</th>
                            <th className="td-donations-number">Requested</th>
                            <th className="td-donations-number">Donations</th>
                            <th className="td-donations-amount">Amount</th>
                            <th className="td-reviewer">Reviewer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {traces.map(m => (
                            <tr key={m._id} className={m.status === 'Pending' ? 'pending' : ''}>
                              <td className="td-actions">
                                <TraceActions trace={m} />
                              </td>
                              <td className="td-created-at">
                                {m.createdAt && (
                                  <span>{moment.utc(m.createdAt).format('Do MMM YYYY')}</span>
                                )}
                              </td>
                              <td className="td-name">
                                <strong>
                                  <Link to={`/trace/${m.slug}`}>
                                    TRACE <em>{getTruncatedText(m.title, 35)}</em>
                                  </Link>
                                </strong>
                                <br />
                                <i className="fa fa-arrow-right" />
                                <Link
                                  className="secondary-link"
                                  to={`/campaigns/${m.campaign._id}`}
                                >
                                  CAMPAIGN <em>{getTruncatedText(m.campaign.title, 40)}</em>
                                </Link>
                              </td>
                              <td className="td-status">
                                {![Trace.PROPOSED, Trace.REJECTED].includes(m.status) &&
                                  (m.status === Trace.PENDING || !m.mined) && (
                                    <span>
                                      <i className="fa fa-circle-o-notch fa-spin" />
                                      &nbsp;
                                    </span>
                                  )}
                                {m.status === 'NeedsReview' && reviewDue(m.updatedAt) && (
                                  <span>
                                    <i className="fa fa-exclamation-triangle" />
                                    &nbsp;
                                  </span>
                                )}
                                {getReadableStatus(m.status)}
                              </td>
                              <td className="td-donations-number">
                                {m.isCapped &&
                                  convertEthHelper(m.maxAmount, m.token && m.token.decimals)}{' '}
                                {getTokenSymbol(m.token)}
                              </td>
                              <td className="td-donations-number">{m.totalDonations}</td>
                              <td className="td-donations-">
                                {m.totalDonated.map(td => (
                                  <div key={td.symbol}>
                                    {convertEthHelper(td.amount, td.decimals)} {td.symbol}
                                  </div>
                                ))}
                              </td>
                              <td className="td-reviewer">
                                {m.reviewer && m.reviewerAddress && (
                                  <Link to={`/profile/${m.reviewerAddress}`}>
                                    {m.reviewer.name || 'Anonymous user'}
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {totalResults > itemsPerPage && (
                        <center>
                          <Pagination
                            activePage={skipPages + 1}
                            itemsCountPerPage={itemsPerPage}
                            totalItemsCount={totalResults}
                            pageRangeDisplayed={visiblePages}
                            onChange={handlePageChanged}
                          />
                        </center>
                      )}
                    </div>
                  )}

                  {traces && traces.length === 0 && (
                    <div className="no-results">
                      <center>
                        <h3>No Traces here!</h3>
                        <img
                          className="empty-state-img"
                          src={`${process.env.PUBLIC_URL}/img/delegation.svg`}
                          width="200px"
                          height="200px"
                          alt="no-traces-icon"
                        />
                      </center>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MyTraces.defaultProps = {};

export default MyTraces;
