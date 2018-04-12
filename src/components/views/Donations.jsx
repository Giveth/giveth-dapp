import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { Link } from 'react-router-dom';
import _ from 'underscore';
import moment from 'moment';
import { paramsForServer } from 'feathers-hooks-common';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import {
  isAuthenticated,
  takeActionAfterWalletUnlock,
  checkWalletBalance,
} from '../../lib/middleware';
import getNetwork from '../../lib/blockchain/getNetwork';
import { displayTransactionError, getGasPrice, getTruncatedText } from '../../lib/helpers';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';

// TODO Remove the eslint exception and fix feathers to provide id's without underscore
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
      isLoading: true,
      isCommitting: false,
      isRejecting: false,
      isRefunding: false,
      donations: [],
      etherScanUrl: '',
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
      });
    });
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.wallet).then(() => {
      this.donationsObserver = feathersClient
        .service('donations')
        .watch({ listStrategy: 'always' })
        .find(
          paramsForServer({
            schema: 'includeTypeDetails',
            query: {
              giverAddress: this.props.currentUser.address,
              $limit: 100,
            },
          }),
        )
        .subscribe(
          resp => {
            this.setState({
              // TODO: Move this to a external class called Donation...
              donations: _.sortBy(resp.data, d => {
                if (d.status === 'pending') return 1;
                if (d.status === 'to_approve') return 2;
                if (d.status === 'waiting') return 3;
                if (d.status === 'committed') return 4;
                if (d.status === 'paying') return 5;
                if (d.status === 'paid') return 6;
                if (d.status === 'cancelled') return 7;
                return 8;
              }),
              isLoading: false,
            });
          },
          () =>
            this.setState({
              isLoading: false,
            }),
        );
    });
  }

  componentWillUnmount() {
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
  }

  commit(donation) {
    takeActionAfterWalletUnlock(this.props.wallet, () =>
      checkWalletBalance(this.props.wallet, this.props.history).then(() =>
        React.swal({
          title: 'Commit your donation?',
          text:
            'Your donation will go to this Milestone. After committing you can no longer take back your money.',
          icon: 'warning',
          buttons: ['Cancel', 'Yes, commit'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            this.setState({ isCommitting: true });

            const doCommit = (etherScanUrl, txHash) => {
              feathersClient
                .service('/donations')
                .patch(donation._id, {
                  status: 'pending',
                  $unset: {
                    pendingProject: true,
                    pendingProjectId: true,
                    pendingProjectType: true,
                    delegate: true,
                    delegateType: true,
                    delegateId: true,
                  },
                  txHash,
                  owner: donation.pendingProject,
                  ownerId: donation.pendingProjectId,
                  ownerType: donation.pendingProjectType,
                })
                .then(() => {
                  this.setState({ isCommitting: false });
                  React.toast.success(
                    <p>
                      Your donation has been committed.<br />
                      <a
                        href={`${etherScanUrl}tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View transaction
                      </a>
                    </p>,
                  );
                })
                .catch(() => {
                  React.toast.error(
                    'Oh no! Something went wrong with the transaction. Please try again.',
                  );
                  this.setState({ isCommitting: false });
                });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getGasPrice()])
              .then(([network, gasPrice]) => {
                const { liquidPledging } = network;
                etherScanUrl = network.etherscan;
                const from = this.props.currentUser.address;

                return liquidPledging
                  .transfer(
                    donation.owner,
                    donation.pledgeId,
                    donation.amount,
                    donation.intendedProject,
                    { $extraGas: 50000, gasPrice, from },
                  )
                  .once('transactionHash', hash => {
                    txHash = hash;
                    doCommit(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    Your donation has been committed.<br />
                    <a
                      href={`${etherScanUrl}tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View transaction
                    </a>
                  </p>,
                );
              })
              .catch(() => {
                displayTransactionError(txHash, etherScanUrl);
              });
          }
        }),
      ),
    );
  }

  reject(donation) {
    takeActionAfterWalletUnlock(this.props.wallet, () =>
      checkWalletBalance(this.props.wallet, this.props.history).then(() =>
        React.swal({
          title: 'Reject your donation?',
          text:
            'Your donation will not go to this Milestone. You will still be in control of you funds and the DAC can still delegate you donation.',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, reject'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            this.setState({ isRejecting: true });

            const doReject = (etherScanUrl, txHash) => {
              feathersClient
                .service('/donations')
                .patch(donation._id, {
                  status: 'pending',
                  $unset: {
                    pendingProject: true,
                    pendingProjectId: true,
                    pendingProjectType: true,
                  },
                  txHash,
                })
                .then(() => {
                  this.setState({ isRejecting: false });
                  React.toast.success(
                    <p>
                      Your donation has been rejected.<br />
                      <a
                        href={`${etherScanUrl}tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View transaction
                      </a>
                    </p>,
                  );
                })
                .catch(() => {
                  React.toast.error(
                    'Oh no! Something went wrong with the transaction. Please try again.',
                  );
                  this.setState({ isRejecting: false });
                });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getGasPrice()])
              .then(([network, gasPrice]) => {
                const { liquidPledging } = network;
                etherScanUrl = network.etherscan;
                const from = this.props.currentUser.address;

                return liquidPledging
                  .transfer(donation.owner, donation.pledgeId, donation.amount, donation.delegate, {
                    $extraGas: 50000,
                    gasPrice,
                    from,
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    doReject(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The delegation has been rejected.<br />
                    <a
                      href={`${etherScanUrl}tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View transaction
                    </a>
                  </p>,
                );
              })
              .catch(() => {
                displayTransactionError(txHash, etherScanUrl);
              });
          }
        }),
      ),
    );
  }

  refund(donation) {
    takeActionAfterWalletUnlock(this.props.wallet, () =>
      checkWalletBalance(this.props.wallet, this.props.history).then(() =>
        React.swal({
          title: 'Refund your donation?',
          text:
            'Your donation will be cancelled and a payment will be authorized to refund your ETH. All withdrawals' +
            ' must be confirmed for security reasons and may take a day or two. Upon confirmation, your ETH will be' +
            ' transferred to your wallet.',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, revoke'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            this.setState({ isRefunding: true });

            const doRefund = (etherScanUrl, txHash) => {
              feathersClient
                .service('/donations')
                .patch(donation._id, {
                  status: 'pending',
                  $unset: {
                    delegate: true,
                    delegateId: true,
                    delegateType: true,
                    pendingProject: true,
                    pendingProjectId: true,
                    pendingProjectType: true,
                  },
                  paymentStatus: 'Paying',
                  txHash,
                })
                .then(() => {
                  this.setState({ isRefunding: false });
                  React.toast.success(
                    <p>
                      The refund is pending...<br />
                      <a
                        href={`${etherScanUrl}tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View transaction
                      </a>
                    </p>,
                  );
                })
                .catch(() => {
                  React.toast.error(
                    'Oh no! Something went wrong with the transaction. Please try again.',
                  );
                  this.setState({ isRefunding: false });
                });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getGasPrice()])
              .then(([network, gasPrice]) => {
                const { liquidPledging } = network;
                etherScanUrl = network.etherscan;
                const from = this.props.currentUser.address;

                return liquidPledging
                  .withdraw(donation.pledgeId, donation.amount, {
                    $extraGas: 50000,
                    from,
                    gasPrice,
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    doRefund(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    Your donation has been refunded!<br />
                    <a
                      href={`${etherScanUrl}tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View transaction
                    </a>
                  </p>,
                );
              })
              .catch(() => {
                displayTransactionError(txHash, etherScanUrl);
              });
          }
        }),
      ),
    );
  }

  render() {
    const { currentUser } = this.props;
    const {
      donations,
      isLoading,
      etherScanUrl,
      isRefunding,
      isCommitting,
      isRejecting,
    } = this.state;

    return (
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
                            <tr key={d._id} className={d.status === 'pending' ? 'pending' : ''}>
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
                                      DAC <em>{getTruncatedText(d.delegateEntity.title, 45)}</em>
                                    </Link>
                                  )}

                                {d.ownerType === 'campaign' &&
                                  d.ownerEntity && (
                                    <Link to={`/${d.ownerType}s/${d.ownerEntity._id}`}>
                                      CAMPAIGN <em>{getTruncatedText(d.ownerEntity.title, 45)}</em>
                                    </Link>
                                  )}

                                {d.ownerType === 'milestone' &&
                                  d.ownerEntity && (
                                    <Link to={`/${d.ownerType}s/${d.ownerEntity._id}`}>
                                      MILESTONE <em>{getTruncatedText(d.ownerEntity.title, 45)}</em>
                                    </Link>
                                  )}
                              </td>
                              <td className="td-donations-amount">{utils.fromWei(d.amount)}ETH</td>

                              <td className="td-transaction-status">
                                {d.status === 'pending' && (
                                  <span>
                                    <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                  </span>
                                )}
                                {Donations.getStatus(d.status)}
                              </td>

                              {etherScanUrl && (
                                <td className="td-tx-address">
                                  <a href={`${etherScanUrl}address/${d.giverAddress}`}>
                                    {d.giverAddress}
                                  </a>
                                </td>
                              )}
                              {!etherScanUrl && <td className="td-tx-address">{d.giverAddress}</td>}

                              <td className="td-actions">
                                {d.ownerId === currentUser.address &&
                                  d.status === 'waiting' && (
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => this.refund(d)}
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
                                        onClick={() => this.commit(d)}
                                        disabled={isCommitting}
                                      >
                                        Commit
                                      </button>
                                      <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => this.reject(d)}
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
    );
  }
}

Donations.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  history: PropTypes.shape({}).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default Donations;
