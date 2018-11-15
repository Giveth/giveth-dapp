import React from 'react';
import { Link } from 'react-router-dom';
// import _ from 'underscore';
import moment from 'moment';

import Loader from '../Loader';
import { convertEthHelper } from '../../lib/helpers';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import DonationProvider, {
  Consumer as DonationConsumer,
} from '../../contextProviders/DonationProvider';
/**
 * The my donations view
 */
const Donations = () => (
  <UserConsumer>
    {({ state: { currentUser, wallet } }) => (
      <DonationProvider currentUser={currentUser} wallet={wallet}>
        <DonationConsumer>
          {({
            state: { isLoading, donations, etherScanUrl },
            actions: { refund, commit, reject },
          }) => (
            <div id="donations-view">
              <div className="container-fluid page-layout dashboard-table-view">
                <div className="row">
                  <div className="col-md-10 m-auto">
                    {(isLoading || (donations && donations.length > 0)) && <h1>Your donations</h1>}

                    {isLoading && <Loader className="fixed" />}

                    {!isLoading && (
                      <div className="table-container">
                        {donations &&
                          donations.length > 0 && (
                            <table className="table table-responsive table-striped table-hover">
                              <thead>
                                <tr>
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
                                      {d.canRefund(currentUser) && (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-danger"
                                          onClick={() => refund(d)}
                                        >
                                          Refund
                                        </button>
                                      )}
                                      {d.canApproveReject(currentUser) && (
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
                                        <span className="badge badge-info" style={{ "marginRight": "5px" }}>
                                          <i className="fa fa-random" />
                                          Proposed delegation&nbsp;
                                        </span>
                                      )}
                                      <Link to={d.donatedTo.url}>
                                        {d.donatedTo.type} <em>{d.donatedTo.name}</em>
                                      </Link>
                                    </td>
                                    <td className="td-donations-amount">
                                      {convertEthHelper(d.amountRemaining)} {d.token && d.token.symbol}
                                    </td>

                                    {etherScanUrl && (
                                      <td className="td-tx-address">
                                        <a href={`${etherScanUrl}address/${d.giverAddress}`}>
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

                        {donations.length === 0 && (
                          <div>
                            <center>
                              <h3>You didn&apos;t make any donations yet!</h3>
                              <img
                                className="empty-state-img"
                                src={`${process.env.PUBLIC_URL}/img/donation.svg`}
                                width="200px"
                                height="200px"
                                alt="no-donations-icon"
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
          )}
        </DonationConsumer>
      </DonationProvider>
    )}
  </UserConsumer>
);

export default Donations;
