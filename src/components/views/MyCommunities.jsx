import React, { Fragment, useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { Helmet } from 'react-helmet';

import { checkBalance } from '../../lib/middleware';
import { getTruncatedText, convertEthHelper, history } from '../../lib/helpers';

import Loader from '../Loader';

import CommunityService from '../../services/CommunityService';
import Community from '../../models/Community';
import AuthenticationWarning from '../AuthenticationWarning';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import ErrorHandler from '../../lib/ErrorHandler';

/**
 * The my communities view
 */
const MyCommunities = () => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { balance },
  } = useContext(Web3Context);

  const [isLoading, setLoading] = useState(true);
  const [communities, setCommunities] = useState();
  const [skipPages, setSkipPages] = useState(0);

  const communitiesObserver = useRef();

  const visiblePages = 10;
  const itemsPerPage = 10;

  const cleanup = () => {
    if (communitiesObserver.current) communitiesObserver.current.unsubscribe();
    communitiesObserver.current = undefined;
  };

  const loadCommunities = _skipPages => {
    communitiesObserver.current = CommunityService.getUserCommunities(
      currentUser.address,
      _skipPages >= 0 ? _skipPages : skipPages,
      itemsPerPage,
      _communities => {
        setCommunities(_communities);
        setLoading(false);
      },
      err => {
        setLoading(false);
        ErrorHandler(err, 'Something went wrong on fetching Communities.');
      },
      true,
    );
  };

  const handlePageChanged = newPage => {
    setSkipPages(newPage - 1);
    cleanup();
    loadCommunities(newPage - 1);
  };

  const editCommunity = id => {
    checkBalance(balance)
      .then(() => {
        history.push(`/communities/${id}/edit`);
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorHandler(err, 'There is no balance left on the account.');
        } else if (err !== undefined) {
          ErrorHandler(err, 'Something went wrong on getting balance.');
        }
      });
  };

  useEffect(() => {
    if (currentUser.address) {
      loadCommunities();
    }
  }, []);

  useEffect(() => {
    if (currentUser.address) {
      setLoading(false);
      setSkipPages(0);
      cleanup();
      loadCommunities(0);
    }
    return cleanup;
  }, [currentUser.address]);

  const isPendingCommunity =
    (communities && communities.data.some(d => d.confirmations !== d.requiredConfirmations)) ||
    false;

  return (
    <Fragment>
      <Helmet>
        <title>My Communities</title>
      </Helmet>
      <div className="container-fluid page-layout dashboard-table-view">
        <div className="row">
          <div className="col-md-10 m-auto">
            {(isLoading || (communities && communities.data.length > 0)) && <h1>My Communities</h1>}

            <AuthenticationWarning />

            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <div>
                {communities && communities.data.length > 0 && (
                  <div>
                    <table className="table table-responsive table-striped table-hover">
                      <thead>
                        <tr>
                          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                          <th className="td-actions" />
                          <th className="td-name">Name</th>
                          <th className="td-donations-number">Donations</th>
                          <th className="td-donations-amount">Amount</th>
                          <th className="td-status">Status</th>
                          <th className="td-confirmations">
                            {isPendingCommunity && 'Confirmations'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {communities.data.map(d => (
                          <tr
                            key={d.id}
                            className={d.status === Community.PENDING ? 'pending' : ''}
                          >
                            <td className="td-actions">
                              <button
                                type="button"
                                className="btn btn-link"
                                onClick={() => editCommunity(d.id)}
                              >
                                <i className="fa fa-edit" />
                              </button>
                            </td>
                            <td className="td-name">
                              <Link to={`/community/${d.slug}`}>
                                {getTruncatedText(d.title, 45)}
                              </Link>
                            </td>
                            <td className="td-donations-number">
                              {d.donationCounters.length > 0 &&
                                d.donationCounters.map(counter => (
                                  <p key={`donations_count-${d.key}-${counter.symbol}`}>
                                    {counter.donationCount} donation(s) in {counter.symbol}
                                  </p>
                                ))}
                              {d.donationCounters.length === 0 && <span>-</span>}
                            </td>
                            <td className="td-donations-amount">
                              {d.donationCounters.length > 0 &&
                                d.donationCounters.map(counter => (
                                  <p key={`total_donated-${d.key}-${counter.symbol}`}>
                                    {convertEthHelper(counter.totalDonated, counter.decimals)}{' '}
                                    {counter.symbol}
                                  </p>
                                ))}

                              {d.donationCounters.length === 0 && <span>-</span>}
                            </td>
                            <td className="td-status">
                              {d.status === Community.PENDING && (
                                <span>
                                  <i className="fa fa-circle-o-notch fa-spin" />
                                  &nbsp;
                                </span>
                              )}
                              {d.status}
                            </td>
                            <td className="td-confirmations">
                              {(isPendingCommunity ||
                                d.requiredConfirmations !== d.confirmations) &&
                                `${d.confirmations}/${d.requiredConfirmations}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {communities.total > communities.limit && (
                      <center>
                        <Pagination
                          activePage={skipPages + 1}
                          itemsCountPerPage={communities.limit}
                          totalItemsCount={communities.total}
                          pageRangeDisplayed={visiblePages}
                          onChange={handlePageChanged}
                        />
                      </center>
                    )}
                  </div>
                )}

                {communities && communities.data.length === 0 && (
                  <div>
                    <center>
                      <h3>You haven&apos;t created any Communities yet!</h3>
                      <img
                        className="empty-state-img"
                        src={`${process.env.PUBLIC_URL}/img/community.svg`}
                        width="200px"
                        height="200px"
                        alt="no-communities-icon"
                      />
                    </center>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default MyCommunities;
