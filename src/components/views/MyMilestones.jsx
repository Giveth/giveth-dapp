import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { LPPCappedMilestones } from 'lpp-capped-milestone-token';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';

import { feathersClient } from '../../lib/feathersClient';
import {
  isLoggedIn,
  redirectAfterWalletUnlock,
  takeActionAfterWalletUnlock,
  checkWalletBalance,
} from '../../lib/middleware';
import getNetwork from '../../lib/blockchain/getNetwork';
import getWeb3 from '../../lib/blockchain/getWeb3';
import Loader from '../Loader';
import User from '../../models/User';
import {
  getGasPrice,
  getTruncatedText,
  getReadableStatus,
  convertEthHelper,
} from '../../lib/helpers';
import GivethWallet from '../../lib/blockchain/GivethWallet';

import ErrorPopup from '../ErrorPopup';

const deleteProposedMilestone = milestone => {
  React.swal({
    title: 'Delete Milestone?',
    text: 'Are you sure you want to delete this Milestone?',
    icon: 'warning',
    dangerMode: true,
    buttons: ['Cancel', 'Yes, delete'],
  }).then(isConfirmed => {
    if (isConfirmed) {
      feathersClient
        .service('/milestones')
        .remove(milestone._id)
        .then(() => {
          React.toast.info(<p>The milestone has been deleted.</p>);
        })
        .catch(e => {
          ErrorPopup('Something went wrong with deleting your milestone', e);
        });
    }
  });
};

const rejectProposedMilestone = milestone => {
  React.swal({
    title: 'Reject Milestone?',
    text: 'Are you sure you want to reject this Milestone?',
    icon: 'warning',
    dangerMode: true,
    buttons: ['Cancel', 'Yes, reject'],
  }).then(isConfirmed => {
    if (isConfirmed) {
      feathersClient
        .service('/milestones')
        .patch(milestone._id, {
          status: 'rejected',
          prevStatus: 'proposed',
        })
        .then(() => {
          React.toast.info(<p>The milestone has been rejected.</p>);
        })
        .catch(e => {
          ErrorPopup('Something went wrong with rejecting your milestone', e);
        });
    }
  });
};

const reproposeRejectedMilestone = milestone => {
  React.swal({
    title: 'Re-propose Milestone?',
    text: 'Are you sure you want to re-propose this Milestone?',
    icon: 'warning',
    dangerMode: true,
    buttons: ['Cancel', 'Yes, re-propose'],
  }).then(isConfirmed => {
    if (isConfirmed) {
      feathersClient
        .service('/milestones')
        .patch(milestone._id, {
          status: 'proposed',
          prevStatus: 'rejected',
        })
        .then(() => {
          React.toast.info(<p>The milestone has been re-proposed.</p>);
        })
        .catch(e => {
          ErrorPopup('Something went wrong with re-proposing your milestone', e);
        });
    }
  });
};

const reviewDue = updatedAt =>
  moment()
    .subtract(3, 'd')
    .isAfter(moment(updatedAt));

// TODO: Remove once rewritten to model
/* eslint no-underscore-dangle: 0 */
/**
 * The my campaings view
 */
class MyMilestones extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      milestones: [],
      visiblePages: 10,
      itemsPerPage: 50,
      skipPages: 0,
      totalResults: 0,
      loadedStatus: 'Active',
    };

    this.milestoneTabs = ['Active', 'Completed', 'Canceled', 'Rejected'];
    this.handlePageChanged = this.handlePageChanged.bind(this);

    this.editMilestone = this.editMilestone.bind(this);
    this.markComplete = this.markComplete.bind(this);
    this.cancelMilestone = this.cancelMilestone.bind(this);
    this.approveMilestone = this.approveMilestone.bind(this);
    this.rejectMilestone = this.rejectMilestone.bind(this);
    this.requestWithdrawal = this.requestWithdrawal.bind(this);
    this.collect = this.collect.bind(this);
  }

  componentDidMount() {
    isLoggedIn(this.props.currentUser).then(() => this.loadMileStones());
  }

  componentWillUnmount() {
    if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
  }

  loadMileStones() {
    const myAddress = this.props.currentUser.address;

    const query = {
      query: {
        $sort: {
          createdAt: -1,
        },
        $limit: this.state.itemsPerPage,
        $skip: this.state.skipPages * this.state.itemsPerPage,
      },
    };

    if (['Completed', 'Canceled'].includes(this.state.loadedStatus)) {
      query.query.$and = [
        {
          $or: [
            { ownerAddress: myAddress },
            // { reviewerAddress: myAddress }, // Not really "My Milestones"
            { recipientAddress: myAddress },
          ],
        },
        { status: this.state.loadedStatus },
      ];
    } else if (this.state.loadedStatus === 'Rejected') {
      query.query.$and = [
        {
          $or: [
            { ownerAddress: myAddress },
            // { reviewerAddress: myAddress }, // Not really "My Milestones"
            { recipientAddress: myAddress },
          ],
        },
        { status: 'rejected' },
      ];
    } else {
      query.query.$and = [
        {
          $or: [
            { ownerAddress: myAddress },
            { reviewerAddress: myAddress },
            { recipientAddress: myAddress },
            { $and: [{ campaignOwnerAddress: myAddress }, { status: 'proposed' }] },
          ],
        },
        { status: { $nin: ['Completed', 'Canceled', 'rejected'] } },
      ];
    }

    this.milestonesObserver = feathersClient
      .service('milestones')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(resp =>
        this.setState({
          milestones: resp.data,
          itemsPerPage: resp.limit,
          skipPages: resp.skip,
          totalResults: resp.total,
          isLoading: false,
        }),
      );
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => this.loadMileStones());
  }

  changeTab(newStatus) {
    this.setState(
      {
        isLoading: true,
        loadedStatus: newStatus,
        skipPages: 0,
      },
      () => {
        if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
        this.loadMileStones();
      },
    );
  }

  editMilestone(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Edit Milestone?',
          text: 'Are you sure you want to edit this Milestone?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            if (['proposed', 'rejected'].includes(milestone.status)) {
              redirectAfterWalletUnlock(
                `/milestones/${milestone._id}/edit/proposed`,
                this.props.wallet,
              );
            } else {
              redirectAfterWalletUnlock(`/milestones/${milestone._id}/edit`, this.props.wallet);
            }
          }
        }),
      );
    });
  }

  markComplete(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Mark as complete?',
          text: 'Are you sure you want to mark this Milestone as complete?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, mark complete'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            feathersClient
              .service('/milestones')
              .patch(milestone._id, {
                status: 'NeedsReview',
              })
              .then(() => {
                React.toast.info(<p>Your milestone has been marked as complete...</p>);
              })
              .catch(e => {
                ErrorPopup('Something went wrong with marking your milestone complete', e);
              });
          }
        }),
      );
    });
  }

  cancelMilestone(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Cancel Milestone?',
          text: 'Are you sure you want to cancel this Milestone?',
          icon: 'warning',
          buttons: ['I changed my mind', 'Yes, cancel'],
          dangerMode: true,
        }).then(isConfirmed => {
          if (isConfirmed) {
            const cancel = (etherScanUrl, txHash) => {
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'Canceled',
                  mined: false,
                  txHash,
                })
                .then(() => {
                  React.toast.info(
                    <p>
                      Cancelling this milestone is pending...<br />
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
                .catch(e => {
                  ErrorPopup('Something went wrong with cancelling your milestone', e);
                });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3(), getGasPrice()])
              .then(([network, web3, gasPrice]) => {
                etherScanUrl = network.etherscan;

                return new LPPCappedMilestones(web3, network.cappedMilestoneAddress)
                  .cancelMilestone(milestone.projectId, {
                    from: this.props.currentUser.address,
                    gasPrice,
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    cancel(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The milestone has been cancelled!<br />
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
                ErrorPopup(
                  'Something went wrong with the transaction. Is your wallet unlocked?',
                  `${etherScanUrl}tx/${txHash}`,
                );
              });
          }
        }),
      );
    });
  }

  acceptProposedMilestone(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Accept Milestone?',
          text: 'Are you sure you want to accept this Milestone?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, accept'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            const createMilestone = (etherScanUrl, txHash) => {
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'pending',
                  prevStatus: 'proposed',
                  mined: false,
                  txHash,
                })
                .then(() => {
                  React.toast.info(
                    <p>
                      Accepting this milestone is pending...<br />
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
                .catch(e => {
                  ErrorPopup('Something went wrong with the transaction. Please try again.', e);
                });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3(), getGasPrice()])
              .then(([network, web3, gasPrice]) => {
                etherScanUrl = network.etherscan;

                return new LPPCappedMilestones(web3, network.cappedMilestoneAddress)
                  .addMilestone(
                    milestone.title,
                    '',
                    milestone.maxAmount,
                    milestone.campaign.projectId,
                    milestone.recipientAddress,
                    milestone.reviewerAddress,
                    milestone.campaignReviewerAddress,
                    { from: this.props.currentUser.address, gasPrice },
                  )
                  .on('transactionHash', hash => {
                    txHash = hash;

                    createMilestone(etherScanUrl, txHash);
                  });
              })
              .catch(() => {
                ErrorPopup(
                  'Something went wrong with the transaction. Is your wallet unlocked?',
                  `${etherScanUrl}tx/${txHash}`,
                );
              });
          }
        }),
      );
    });
  }

  approveMilestone(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Approve Milestone?',
          text: 'Are you sure you want to approve this Milestone?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, approve'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            const approve = (etherScanUrl, txHash) => {
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'Completed',
                  mined: false,
                  txHash,
                })
                .then(() => {
                  React.toast.info(
                    <p>
                      Approving this milestone is pending...<br />
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
                .catch(e => {
                  ErrorPopup('Something went wrong with approving your milestone', e);
                });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3(), getGasPrice()])
              .then(([network, web3, gasPrice]) => {
                etherScanUrl = network.etherscan;

                return new LPPCappedMilestones(web3, network.cappedMilestoneAddress)
                  .acceptMilestone(milestone.projectId, {
                    from: this.props.currentUser.address,
                    gasPrice,
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    approve(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The milestone has been approved!<br />
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
                ErrorPopup(
                  'Something went wrong with the transaction. Is your wallet unlocked?',
                  `${etherScanUrl}tx/${txHash}`,
                );
              });
          }
        }),
      );
    });
  }

  rejectMilestone(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Reject Milestone?',
          text: 'Are you sure you want to reject this Milestone?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, reject'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            feathersClient
              .service('/milestones')
              .patch(milestone._id, {
                prevStatus: 'NeedsReview',
                status: 'InProgress',
              })
              .then(() => {
                React.toast.info(<p>You have rejected this milestone...</p>);
              })
              .catch(e => {
                ErrorPopup(
                  'Something went wrong with the transaction. Is your wallet unlocked?',
                  e,
                );
              });
          }
        }),
      );
    });
  }

  requestWithdrawal(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Request Withdrawal',
          text:
            "For security reasons, there's a 3 day delay from the moment you request withdrawal before you can actually withdraw the money.",
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, request withdrawal'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            if (isConfirmed) {
              const withdraw = (etherScanUrl, txHash) => {
                feathersClient
                  .service('/milestones')
                  .patch(milestone._id, {
                    status: 'Paying',
                    mined: false,
                    txHash,
                  })
                  .then(() => {
                    React.toast.info(
                      <p>
                        Request withdrawal from milestone...<br />
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
                  .catch(e => {
                    ErrorPopup('Something went wrong doing the withdrawal', e);
                  });

                feathersClient
                  .service('donations')
                  .patch(
                    null,
                    {
                      status: 'pending',
                      paymentStatus: 'Paying',
                      txHash,
                    },
                    {
                      query: {
                        ownerType: 'milestone',
                        ownerId: milestone._id,
                      },
                    },
                  )
                  .catch(e => {
                    ErrorPopup('Something went wrong doing the withdrawal', e);
                  });
              };

              const getPledges = () =>
                feathersClient
                  .service('donations')
                  .find({
                    query: {
                      ownerType: 'milestone',
                      ownerId: milestone._id,
                    },
                  })
                  .then(({ data }) => {
                    if (data.length === 0) throw new Error('No donations found to withdraw');

                    const pledges = [];
                    data.forEach(donation => {
                      const pledge = pledges.find(n => n.id === donation.pledgeId);

                      if (pledge) {
                        pledge.amount = pledge.amount.add(utils.toBN(donation.amount));
                      } else {
                        pledges.push({
                          id: donation.pledgeId,
                          amount: utils.toBN(donation.amount),
                        });
                      }
                    });

                    return pledges.map(
                      note =>
                        `0x${utils.padLeft(
                          utils.toHex(note.amount).substring(2),
                          48,
                        )}${utils.padLeft(utils.toHex(note.id).substring(2), 16)}`,
                    );
                  });

              let txHash;
              let etherScanUrl;
              Promise.all([getNetwork(), getWeb3(), getPledges(), getGasPrice()])
                .then(([network, web3, pledges, gasPrice]) => {
                  etherScanUrl = network.etherscan;

                  return new LPPCappedMilestones(web3, network.cappedMilestoneAddress)
                    .mWithdraw(pledges, {
                      from: this.props.currentUser.address,
                      gasPrice,
                    })
                    .once('transactionHash', hash => {
                      txHash = hash;
                      withdraw(etherScanUrl, txHash);
                    });
                })
                .then(() => {
                  React.toast.info(
                    <p>
                      The milestone withdraw has been initiated...<br />
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
                .catch(e => {
                  console.error(e); // eslint-disable-line no-console

                  let msg;
                  if (txHash) {
                    // TODO: need to update feathers to reset the donations to previous state as this
                    // tx failed.
                    msg = (
                      <p>
                        Something went wrong with the transaction.<br />
                        <a
                          href={`${etherScanUrl}tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View transaction
                        </a>
                      </p>
                    );
                  } else if (e.message === 'No donations found to withdraw') {
                    msg = <p>Nothing to withdraw. There are no donations to this milestone.</p>;
                  } else {
                    msg = (
                      <p>Something went wrong with the transaction. Is your wallet unlocked?</p>
                    );
                  }

                  React.swal({
                    title: 'Oh no!',
                    content: React.swal.msg(msg),
                    icon: 'error',
                  });
                });
            }
          }
        }),
      );
    });
  }

  collect(milestone) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Collect Funds',
          text: 'The funds will be transferred to you wallet.',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, collect'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            if (isConfirmed) {
              const collect = (etherScanUrl, txHash) => {
                feathersClient
                  .service('/milestones')
                  .patch(milestone._id, {
                    status: 'Paid',
                    mined: false,
                    txHash,
                  })
                  .then(() => {
                    React.toast.info(
                      <p>
                        Collecting funds from milestone...<br />
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
                  .catch(e => {
                    ErrorPopup('Something went wrong with collecting your funds', e);
                  });
              };

              let txHash;
              let etherScanUrl;
              Promise.all([getNetwork(), getWeb3(), getGasPrice()])
                .then(([network, web3, gasPrice]) => {
                  etherScanUrl = network.etherscan;

                  return new LPPCappedMilestones(web3, network.cappedMilestoneAddress)
                    .collect(milestone.projectId, {
                      from: this.props.currentUser.address,
                      $extraGas: 100000,
                      gasPrice,
                    })
                    .once('transactionHash', hash => {
                      txHash = hash;
                      collect(etherScanUrl, txHash);
                    });
                })
                .catch(() => {
                  ErrorPopup(
                    'Something went wrong with the transaction. Is your wallet unlocked?',
                    `${etherScanUrl}tx/${txHash}`,
                  );
                });
            }
          }
        }),
      );
    });
  }

  render() {
    const {
      milestones,
      isLoading,
      totalResults,
      skipPages,
      itemsPerPage,
      visiblePages,
    } = this.state;
    const { currentUser } = this.props;

    return (
      <div id="milestones-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">
              <h1>Your milestones</h1>

              <ul className="nav nav-tabs">
                {this.milestoneTabs.map(st => (
                  <li className="nav-item">
                    <span
                      role="button"
                      className={`nav-link ${this.state.loadedStatus === st ? 'active' : ''}`}
                      onKeyPress={() => this.changeTab(st)}
                      tabIndex={0}
                      onClick={() => this.changeTab(st)}
                    >
                      {st}
                    </span>
                  </li>
                ))}
              </ul>

              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div className="table-container">
                  {milestones &&
                    milestones.length > 0 && (
                      <div>
                        <table className="table table-responsive table-striped table-hover">
                          <thead>
                            <tr>
                              <th className="td-created-at">Created</th>
                              <th className="td-name">Name</th>
                              <th className="td-status">Status</th>
                              <th className="td-donations-number">Requested</th>
                              <th className="td-donations-number">Donations</th>
                              <th className="td-donations-amount">Donated</th>
                              <th className="td-reviewer">Reviewer</th>
                              <th className="td-actions" />
                            </tr>
                          </thead>
                          <tbody>
                            {milestones.map(m => (
                              <tr key={m._id} className={m.status === 'pending' ? 'pending' : ''}>
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
                                  {(m.status === 'pending' ||
                                    (Object.keys(m).includes('mined') && !m.mined)) && (
                                    <span>
                                      <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                    </span>
                                  )}
                                  {m.status === 'NeedsReview' &&
                                    reviewDue(m.updatedAt) && (
                                      <span>
                                        <i className="fa fa-exclamation-triangle" />&nbsp;
                                      </span>
                                    )}
                                  {getReadableStatus(m.status)}
                                </td>
                                <td className="td-donations-number">
                                  {convertEthHelper(m.maxAmount)} ETH
                                </td>
                                <td className="td-donations-number">{m.donationCount || 0}</td>
                                <td className="td-donations-amount">
                                  {convertEthHelper(m.totalDonated)} ETH
                                </td>
                                <td className="td-reviewer">
                                  {m.reviewer &&
                                    m.reviewer.address && (
                                      <Link to={`/profile/${m.reviewer.address}`}>
                                        {m.reviewer.name || 'Anomynous user'}
                                      </Link>
                                    )}
                                </td>
                                <td className="td-actions">
                                  {/* Campaign and Milestone managers can edit milestone */}
                                  {(m.ownerAddress === currentUser.address ||
                                    m.campaign.ownerAddress === currentUser.address) &&
                                    ['proposed', 'rejected', 'InProgress', 'NeedsReview'].includes(
                                      m.status,
                                    ) && (
                                      <button
                                        className="btn btn-link"
                                        onClick={() => this.editMilestone(m)}
                                      >
                                        <i className="fa fa-edit" />&nbsp;Edit
                                      </button>
                                    )}

                                  {m.campaignOwnerAddress === currentUser.address &&
                                    m.status === 'proposed' && (
                                      <span>
                                        <button
                                          className="btn btn-success btn-sm"
                                          onClick={() => this.acceptProposedMilestone(m)}
                                        >
                                          <i className="fa fa-check-square-o" />&nbsp;Accept
                                        </button>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => rejectProposedMilestone(m)}
                                        >
                                          <i className="fa fa-times-circle-o" />&nbsp;Reject
                                        </button>
                                      </span>
                                    )}
                                  {m.ownerAddress === currentUser.address &&
                                    m.status === 'rejected' && (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => reproposeRejectedMilestone(m)}
                                      >
                                        <i className="fa fa-times-square-o" />&nbsp;Re-propose
                                      </button>
                                    )}

                                  {(m.recipientAddress === currentUser.address ||
                                    m.ownerAddress === currentUser.address) &&
                                    m.status === 'InProgress' &&
                                    m.mined && (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => this.markComplete(m)}
                                      >
                                        Mark complete
                                      </button>
                                    )}
                                  {[
                                    m.reviewerAddress,
                                    m.campaignReviewerAddress,
                                    m.recipientAddress,
                                  ].includes(currentUser.address) &&
                                    ['InProgress', 'NeedReview'].includes(m.status) &&
                                    m.mined && (
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => this.cancelMilestone(m)}
                                      >
                                        <i className="fa fa-times" />&nbsp;Cancel
                                      </button>
                                    )}

                                  {m.ownerAddress === currentUser.address &&
                                    ['proposed', 'rejected'].includes(m.status) && (
                                      <span>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => deleteProposedMilestone(m)}
                                        >
                                          <i className="fa fa-times-circle-o" />&nbsp;Delete
                                        </button>
                                      </span>
                                    )}

                                  {m.reviewerAddress === currentUser.address &&
                                    m.status === 'NeedsReview' &&
                                    m.mined && (
                                      <span>
                                        <button
                                          className="btn btn-success btn-sm"
                                          onClick={() => this.approveMilestone(m)}
                                        >
                                          <i className="fa fa-thumbs-up" />&nbsp;Approve
                                        </button>

                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => this.rejectMilestone(m)}
                                        >
                                          <i className="fa fa-thumbs-down" />&nbsp;Reject
                                        </button>
                                      </span>
                                    )}

                                  {
                                    // To be added back once users can request payment
                                    /* {m.recipientAddress === currentUser.address &&
                                    m.status === 'Completed' &&
                                    m.mined &&
                                    m.donationCount > 0 && (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => this.requestWithdrawal(m)}
                                      >
                                        <i className="fa fa-usd" />&nbsp;Request Withdrawal
                                      </button>
                                    )}

                                  {m.recipientAddress === currentUser.address &&
                                    m.status === 'Paying' && (
                                      <p>
                                        Withdraw authorization pending. You will be able to collect
                                        the funds when confirmed.
                                      </p>
                                    )}

                                  {m.recipientAddress === currentUser.address &&
                                    m.status === 'CanWithdraw' &&
                                    m.mined && (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => this.collect(m)}
                                      >
                                        <i className="fa fa-usd" />&nbsp;Collect
                                      </button>
                                    )} */
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <center>
                          <Pagination
                            activePage={skipPages + 1}
                            itemsCountPerPage={itemsPerPage}
                            totalItemsCount={totalResults}
                            pageRangeDisplayed={visiblePages}
                            onChange={this.handlePageChanged}
                          />
                        </center>
                      </div>
                    )}

                  {milestones &&
                    milestones.length === 0 && (
                      <div className="no-results">
                        <center>
                          <h3>No milestones here!</h3>
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
    );
  }
}

MyMilestones.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default MyMilestones;
