import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import { Context as WhiteListContext } from 'contextProviders/WhiteListProvider';
import MilestoneActions from 'components/MilestoneActions';
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

import MilestoneService from '../../services/MilestoneService';
import Milestone from '../../models/Milestone';

const reviewDue = updatedAt =>
  moment()
    .subtract(3, 'd')
    .isAfter(moment(updatedAt));

/**
 * The my milestones view
 */
function MyMilestones() {
  const [isLoading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [itemsPerPage, setItemPerPage] = useState(10);
  const [skipPages, setSkipPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [milestoneStatus, setMilestoneStatus] = useState('Active');

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

  const milestoneTabs = ['Active', 'Paid', 'Canceled', 'Rejected'];
  function cleanUp() {
    MilestoneService.unsubscribe();
  }

  function loadMileStones() {
    const myAddress = currentUser && currentUser.address;

    MilestoneService.subscribeMyMilestones({
      milestoneStatus,
      ownerAddress: myAddress,
      coownerAddress: myAddress,
      recipientAddress: myAddress,
      skipPages,
      itemsPerPage,
      onResult: resp => {
        setMilestones(resp.data);
        setItemPerPage(resp.limit);
        setSkipPages(resp.skip);
        setTotalResults(resp.total);
        setLoading(false);
      },
      onError: err => {
        ErrorPopup('Something went wrong.', err);
        // TO DO: handle error here in view
        setLoading(false);
      },
    });
  }
  useEffect(() => {
    loadMileStones();
    return cleanUp;
  }, []);

  useEffect(() => {
    setLoading(true);
    cleanUp();
    loadMileStones();
  }, [currentUser, milestoneStatus]);

  function getTokenSymbol(token) {
    if (token.foreignAddress === ANY_TOKEN.foreignAddress) {
      return tokenWhitelist.map(t => t.symbol).join(', ');
    }
    return token.symbol;
  }

  function handlePageChanged(newPage) {
    setSkipPages(newPage - 1, () => loadMileStones());
  }

  function changeTab(newStatus) {
    setLoading(true);
    setSkipPages(0);
    setMilestoneStatus(newStatus);
  }

  return (
    <div id="milestones-view">
      <div className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-10 m-auto">
            <h1>Your Milestones</h1>
            <ViewNetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />

            <AuthenticationWarning />

            <div className="dashboard-table-view">
              <ul className="nav nav-tabs">
                {milestoneTabs.map(st => (
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
                  {milestones && milestones.length > 0 && (
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
                          {milestones.map(m => (
                            <tr key={m._id} className={m.status === 'Pending' ? 'pending' : ''}>
                              <td className="td-actions">
                                <MilestoneActions milestone={m} />
                              </td>
                              <td className="td-created-at">
                                {m.createdAt && (
                                  <span>{moment.utc(m.createdAt).format('Do MMM YYYY')}</span>
                                )}
                              </td>
                              <td className="td-name">
                                <strong>
                                  <Link to={`/campaigns/${m.campaign._id}/milestones/${m._id}`}>
                                    MILESTONE <em>{getTruncatedText(m.title, 35)}</em>
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
                                {![Milestone.PROPOSED, Milestone.REJECTED].includes(m.status) &&
                                  (m.status === Milestone.PENDING || !m.mined) && (
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
                            activePage={Math.floor(skipPages / itemsPerPage) + 1}
                            itemsCountPerPage={itemsPerPage}
                            totalItemsCount={totalResults}
                            pageRangeDisplayed={visiblePages}
                            onChange={handlePageChanged}
                          />
                        </center>
                      )}
                    </div>
                  )}

                  {milestones && milestones.length === 0 && (
                    <div className="no-results">
                      <center>
                        <h3>No Milestones here!</h3>
                        <img
                          className="empty-state-img"
                          src={`${process.env.PUBLIC_URL}/img/delegation.svg`}
                          width="200px"
                          height="200px"
                          alt="no-milestones-icon"
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
}

MyMilestones.defaultProps = {};

export default MyMilestones;
