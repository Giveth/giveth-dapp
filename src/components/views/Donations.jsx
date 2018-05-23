import React, { Component } from 'react';
import { Link } from 'react-router-dom';
// import _ from 'underscore';
import moment from 'moment';

import Loader from '../Loader';
import { getTruncatedText, convertEthHelper } from '../../lib/helpers';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import DonationProvider, {
  Consumer as DonationConsumer,
} from '../../contextProviders/DonationProvider';
// TODO: Remove once rewritten to model
/* eslint no-underscore-dangle: 0 */
/**
 * The my donations view
 */

class Donations extends Component {
  // TODO: Move this to a external class called Donation...
  static getStatus(status) {
    switch (status) {
      case 'pending':
        return 'pending successful transaction';
      case 'to_approve':
        return 'pending for your approval to be committed.';
      case 'waiting':
        return 'waiting for further delegation';
      case 'committed':
        return 'committed';
      case 'paying':
        return 'paying';
      case 'paid':
        return 'paid';
      default:
        return 'unknown';
    }
  }

  constructor() {
    super();

    this.state = {
      isCommitting: false,
      isRejecting: false,
      isRefunding: false,
      etherScanUrl: '',
    };
  }

  render() {
    const { etherScanUrl, isRefunding, isCommitting, isRejecting } = this.state;

    return (
      <UserConsumer>
        {({ state: { currentUser, wallet } }) => (
          <DonationProvider currentUser={currentUser} wallet={wallet}>
            <DonationConsumer>
              {({ state: { isLoading, donations }, actions: { refund, commit, reject } }) => (
                <div id="donations-view">
                  <div className="container-fluid page-layout dashboard-table-view">
                    <div className="row">
                      <div className="col-md-10 m-auto">
                        {(isLoading || (donations && donations.length > 0)) && (
                          <h1>Your donations</h1>
                        )}

                        {isLoading && <Loader className="fixed" />}

                        {!isLoading && (
                          <div className="table-container">
                            {donations &&
                              donations.length > 0 && (
                                <table className="table table-responsive table-striped table-hover">
                                  <thead>
                                    <tr>
                                      <th className="td-date">Date</th>
                                      <th className="td-donated-to">Donated to</th>
                                      <th className="td-donations-amount">Amount</th>
                                      <th className="td-transaction-status">Status</th>
                                      <th className="td-tx-address">Address</th>
                                      <th className="td-action" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {donations.map(d => (
                                      <tr
                                        key={d.id}
                                        className={d.status === 'pending' ? 'pending' : ''}
                                      >
                                        <td className="td-date">
                                          {moment(d.createdAt).format('MM/DD/YYYY')}
                                        </td>

                                        <td className="td-donated-to">
                                          {d.intendedProject > 0 && (
                                            <span className="badge badge-info">
                                              <i className="fa fa-random" />
                                              &nbsp;Delegated
                                            </span>
                                          )}

                                          {d.delegate > 0 &&
                                            d.delegateEntity && (
                                              <Link to={`/dacs/${d.delegateEntity._id}`}>
                                                DAC{' '}
                                                <em>
                                                  {getTruncatedText(d.delegateEntity.title, 45)}
                                                </em>
                                              </Link>
                                            )}

                                          {d.ownerType === 'giver' &&
                                            !d.delegate && (
                                              <Link to={`/profile/${d.ownerEntity.address}`}>
                                                GIVER{' '}
                                                <em>
                                                  {d.ownerEntity.address === currentUser.address
                                                    ? 'You'
                                                    : d.ownerEntity.name || d.ownerEntity.address}
                                                </em>
                                              </Link>
                                            )}

                                          {d.ownerType === 'campaign' &&
                                            d.ownerEntity && (
                                              <Link to={`/${d.ownerType}s/${d.ownerEntity._id}`}>
                                                CAMPAIGN{' '}
                                                <em>{getTruncatedText(d.ownerEntity.title, 45)}</em>
                                              </Link>
                                            )}

                                          {d.ownerType === 'milestone' &&
                                            d.ownerEntity && (
                                              <Link to={`/${d.ownerType}s/${d.ownerEntity._id}`}>
                                                MILESTONE{' '}
                                                <em>{getTruncatedText(d.ownerEntity.title, 45)}</em>
                                              </Link>
                                            )}
                                        </td>
                                        <td className="td-donations-amount">
                                          {convertEthHelper(d.amount)} ETH
                                        </td>

                                        <td className="td-transaction-status">
                                          {d.status === 'pending' && (
                                            <span>
                                              <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                            </span>
                                          )}
                                          {d.status === 'waiting' &&
                                          d.ownerEntity.address === currentUser.address ? (
                                            <Link to="/delegations">
                                              {Donations.getStatus(d.status)}
                                            </Link>
                                          ) : (
                                            Donations.getStatus(d.status)
                                          )}
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

                                        <td className="td-actions">
                                          {d.ownerId === currentUser.address &&
                                            d.status === 'waiting' && (
                                              <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => refund(d)}
                                                disabled={isRefunding}
                                              >
                                                Refund
                                              </button>
                                            )}
                                          {d.ownerId === currentUser.address &&
                                            d.status === 'to_approve' &&
                                            new Date() < new Date(d.commitTime) && (
                                              <div>
                                                <button
                                                  className="btn btn-sm btn-success"
                                                  onClick={() => commit(d)}
                                                  disabled={isCommitting}
                                                >
                                                  Commit
                                                </button>
                                                <button
                                                  className="btn btn-sm btn-danger"
                                                  onClick={() => reject(d)}
                                                  disabled={isRejecting}
                                                >
                                                  Reject
                                                </button>
                                              </div>
                                            )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}

                            {donations &&
                              donations.length === 0 && (
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
  }
}

Donations.propTypes = {};

export default Donations;
