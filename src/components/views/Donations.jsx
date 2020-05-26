import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Consumer as Web3Consumer } from 'contextProviders/Web3Provider';
import config from 'configuration';

import Loader from '../Loader';
import { convertEthHelper } from '../../lib/helpers';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import DonationProvider, {
  Consumer as DonationConsumer,
} from '../../contextProviders/DonationProvider';
import AuthenticationWarning from '../AuthenticationWarning';

/**
 * The my donations view
 */
const Donations = () => (
  <Web3Consumer>
    {({ state: { isForeignNetwork, balance } }) => (
      <UserConsumer>
        {({ state: { currentUser } }) => (
          <DonationProvider currentUser={currentUser} balance={balance}>
            <DonationConsumer>
              {({
                state: {
                  isLoading,
                  donations,
                  etherScanUrl,
                  totalResults,
                  visiblePages,
                  skipPages,
                  itemsPerPage,
                },
                actions: { refund, commit, reject, handlePageChanged },
              }) => (
                <div id="donations-view">
                  <div className="container-fluid page-layout">
                    <div className="row">
                      <div className="col-md-10 m-auto">
                        {(isLoading || (donations && donations.length > 0)) && (
                          <h1>Your donations</h1>
                        )}

                        <ViewNetworkWarning
                          incorrectNetwork={!isForeignNetwork}
                          networkName={config.foreignNetworkName}
                        />

                        <AuthenticationWarning currentUser={currentUser} />

                        {isLoading && <Loader className="fixed" />}

                        {!isLoading && (
                          <div className="table-container dashboard-table-view">
                            {donations && donations.length > 0 && (
                              <table className="table table-responsive table-striped table-hover">
                                <thead>
                                  <tr>
                                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                                    <th className="td-action" />
                                    <th className="td-transaction-status">Status</th>
                                    <th className="td-date">Date</th>
                                    <th className="td-donated-to">Donated to</th>
                                    <th className="td-donations-amount">Amount</th>
                                    <th className="td-tx-address">Address</th>
                                    <th className="td-confirmations">
                                      {donations.some(d => d.isPending) && 'Confirmations'}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {donations.map(d => (
                                    <tr key={d.id} className={d.isPending ? 'pending' : ''}>
                                      <td className="td-actions">
                                        {d.canRefund(currentUser, isForeignNetwork) && (
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => refund(d)}
                                          >
                                            Refund
                                          </button>
                                        )}
                                        {d.canApproveReject(currentUser, isForeignNetwork) && (
                                          <div>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-success"
                                              onClick={() => commit(d)}
                                            >
                                              Commit
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-danger"
                                              onClick={() => reject(d)}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                      <td className="td-transaction-status">
                                        {d.isPending && (
                                          <span>
                                            <i className="fa fa-circle-o-notch fa-spin" />
                                            &nbsp;
                                          </span>
                                        )}
                                        {d.canDelegate(currentUser) ? (
                                          <Link to="/delegations">{d.statusDescription}</Link>
                                        ) : (
                                          d.statusDescription
                                        )}
                                      </td>

                                      <td className="td-date">
                                        {moment(d.createdAt).format('MM/DD/YYYY')}
                                      </td>

                                      <td className="td-donated-to">
                                        {d.intendedProjectId > 0 && (
                                          <Fragment>
                                            <span className="badge badge-info">
                                              <i className="fa fa-random" />
                                              &nbsp;Delegated
                                            </span>
                                            <span>&nbsp;</span>
                                          </Fragment>
                                        )}
                                        <Link to={d.donatedTo.url}>
                                          {d.donatedTo.type} <em>{d.donatedTo.name}</em>
                                        </Link>
                                      </td>
                                      <td className="td-donations-amount">
                                        {convertEthHelper(d.amountRemaining, d.token.decimals)}{' '}
                                        {d.token && d.token.symbol}
                                      </td>

                                      {etherScanUrl && (
                                        <td className="td-tx-address">
                                          <a
                                            href={`${etherScanUrl}address/${d.giverAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {d.giverAddress}
                                          </a>
                                        </td>
                                      )}
                                      {!etherScanUrl && (
                                        <td className="td-tx-address">{d.giverAddress}</td>
                                      )}

                                      <td className="td-confirmations">
                                        {donations.some(dn => dn.isPending) &&
                                          `${d.confirmations}/${d.requiredConfirmations}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {donations && totalResults > itemsPerPage && (
                              <div className="text-center">
                                <Pagination
                                  activePage={skipPages + 1}
                                  itemsCountPerPage={itemsPerPage}
                                  totalItemsCount={totalResults}
                                  pageRangeDisplayed={visiblePages}
                                  onChange={handlePageChanged}
                                />
                              </div>
                            )}

                            {donations.length === 0 && (
                              <div>
                                <div className="text-center">
                                  <h3>You didn&apos;t make any donations yet!</h3>
                                  <img
                                    className="empty-state-img"
                                    src={`${process.env.PUBLIC_URL}/img/donation.svg`}
                                    width="200px"
                                    height="200px"
                                    alt="no-donations-icon"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DonationConsumer>
          </DonationProvider>
        )}
      </UserConsumer>
    )}
  </Web3Consumer>
);

export default Donations;
