import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { LPPCappedMilestone } from 'lpp-capped-milestone';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';
import GA from 'lib/GoogleAnalytics';

import ConversationModal from 'components/ConversationModal';
import NetworkWarning from 'components/NetworkWarning';
import { Consumer as Web3Consumer } from 'contextProviders/Web3Provider';

import { feathersClient } from '../../lib/feathersClient';
import { isLoggedIn, checkBalance } from '../../lib/middleware';
import confirmationDialog from '../../lib/confirmationDialog';
import getNetwork from '../../lib/blockchain/getNetwork';
import getWeb3 from '../../lib/blockchain/getWeb3';
import extraGas from '../../lib/blockchain/extraGas';
import Loader from '../Loader';
import User from '../../models/User';
import { getTruncatedText, getReadableStatus, convertEthHelper, history } from '../../lib/helpers';
import config from '../../configuration';

import ErrorPopup from '../ErrorPopup';
import Donation from '../../models/Donation';

const deleteProposedMilestone = milestone => {
  const confirmDeleteMilestone = () => {
    feathersClient
      .service('/milestones')
      .remove(milestone._id)
      .then(() => {
        React.toast.info(<p>The milestone has been deleted.</p>);
      })
      .catch(e => {
        ErrorPopup('Something went wrong with deleting your milestone', e);
      });
  };
  confirmationDialog('milestone', milestone.title, confirmDeleteMilestone);
};

const rejectProposedMilestone = milestone => {
  React.swal({
    title: 'Reject Milestone?',
    text: 'Are you sure you want to reject this Milestone?',
    icon: 'warning',
    dangerMode: true,
    buttons: ['Cancel', 'Yes, reject'],
    content: {
      element: 'input',
      attributes: {
        placeholder: 'Add a reason why you reject this proposed milestone...',
      },
    },
  }).then(message => {
    const newContent = { status: 'Rejected' };
    if (message) newContent.message = message;
    feathersClient
      .service('/milestones')
      .patch(milestone._id, newContent)
      .then(() => {
        React.toast.info(<p>The proposed milestone has been rejected.</p>);
      })
      .catch(e => {
        ErrorPopup('Something went wrong with rejecting the proposed milestone', e);
      });
  });
};

const reproposeRejectedMilestone = milestone => {
  this.conversationModal.current
    .openModal({
      title: 'Reject proposed milestone',
      description:
        'Optionally explain why you reject this proposed milestone. This information will be publicly visible and emailed to the milestone owner.',
      textPlaceholder: 'Optionally explain why you reject this proposal...',
      required: false,
      cta: 'Reject proposal',
      enableAttachProof: false,
    })
    .then(proof =>
      feathersClient
        .service('/milestones')
        .patch(milestone._id, {
          status: 'proposed',
          message: proof.message,
          proofItems: proof.proofItems,
        })
        .then(() => {
          GA.trackEvent({
            category: 'Milestone',
            action: 'reproposed rejected milestone',
            label: milestone._id,
          });
          React.toast.info(<p>The milestone has been re-proposed.</p>);
        })
        .catch(e => {
          ErrorPopup('Something went wrong with re-proposing your milestone', e);
        }),
    );
};

const reviewDue = updatedAt =>
  moment()
    .subtract(3, 'd')
    .isAfter(moment(updatedAt));

/**
 * The my milestones view
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

    this.conversationModal = React.createRef();

    this.milestoneTabs = ['Active', 'Paid', 'Canceled', 'Rejected'];
    this.handlePageChanged = this.handlePageChanged.bind(this);

    this.editMilestone = this.editMilestone.bind(this);
    this.requestMarkComplete = this.requestMarkComplete.bind(this);
    this.cancelMilestone = this.cancelMilestone.bind(this);
    this.approveMilestoneCompleted = this.approveMilestoneCompleted.bind(this);
    this.rejectMilestoneCompletion = this.rejectMilestoneCompletion.bind(this);
    this.requestWithdrawal = this.withdrawal.bind(this);
    // this.collect = this.collect.bind(this);
  }

  componentDidMount() {
    isLoggedIn(this.props.currentUser)
      .then(() => this.loadMileStones())
      .catch(err => {
        if (err === 'notLoggedIn') {
          // default behavior is to go home or signin page after swal popup
        }
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isLoading: true });
      if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
      this.loadMileStones();
    }
  }

  componentWillUnmount() {
    if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
  }

  async loadMileStones() {
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

    if (['Paid', 'Canceled'].includes(this.state.loadedStatus)) {
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
        { status: 'Rejected' },
      ];
    } else {
      const resp = await feathersClient
        .service('campaigns')
        .find({ query: { ownerAddress: myAddress } });
      const campaignsIDs = resp.data.map(c => c._id);
      query.query.$and = [
        {
          $or: [
            { ownerAddress: myAddress },
            { reviewerAddress: myAddress },
            { recipientAddress: myAddress },
            { $and: [{ campaignId: { $in: campaignsIDs } }, { status: 'Proposed' }] },
          ],
        },
        { status: { $nin: ['Paid', 'Canceled', 'Rejected'] } },
      ];
    }

    this.milestonesObserver = feathersClient
      .service('milestones')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(resp => {
        this.setState({
          milestones: resp.data,
          itemsPerPage: resp.limit,
          skipPages: resp.skip,
          totalResults: resp.total,
          isLoading: false,
        });
      });
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
    checkBalance(this.props.balance)
      .then(() => {
        if (['Proposed', 'Rejected'].includes(milestone.status)) {
          history.push(`/milestones/${milestone._id}/edit/proposed`);
        } else {
          history.push(`/milestones/${milestone._id}/edit`);
        }
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  requestMarkComplete(milestone) {
    checkBalance(this.props.balance)
      .then(() => {
        this.conversationModal.current
          .openModal({
            title: 'Mark milestone complete',
            description:
              "Describe what you've done to finish the work of this milestone and attach proof if necessary. This information will be publicly visible and emailed to the reviewer.",
            required: false,
            cta: 'Mark complete',
            enableAttachProof: true,
            textPlaceholder: "Describe what you've done...",
          })
          .then(proof => {
            // feathers
            const _requestMarkComplete = (etherScanUrl, txHash) => {
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'NeedsReview',
                  message: proof.message,
                  proofItems: proof.items,
                  mined: false,
                  txHash,
                })
                .then(() => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'marked complete',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Marking this milestone as complete is pending...
                      <br />
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
                  ErrorPopup('Something went wrong with marking your milestone as complete', e);
                });
            };

            // on chain
            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3()])
              .then(([network, web3]) => {
                etherScanUrl = network.etherscan;

                const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

                return cappedMilestone
                  .requestMarkAsComplete({
                    from: this.props.currentUser.address,
                    $extraGas: extraGas(),
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    return _requestMarkComplete(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The milestone has been marked as complete!
                    <br />
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
              .catch(err => {
                if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
                ErrorPopup(
                  'Something went wrong with the transaction.',
                  `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
                );
              });
          })
          .catch(err => {
            if (err === 'noBalance') {
              // handle no balance error
            }
          });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  cancelMilestone(milestone) {
    checkBalance(this.props.balance)
      .then(() =>
        this.conversationModal.current
          .openModal({
            title: 'Cancel milestone',
            description:
              'Explain why you cancel this milestone. Compliments are appreciated! This information will be publicly visible and emailed to the milestone owner.',
            textPlaceholder: 'Explain why you cancel this milestone...',
            required: true,
            cta: 'Cancel milestone',
            enableAttachProof: false,
          })
          .then(proof => {
            const _cancelMilestone = (etherScanUrl, txHash) => {
              // feathers
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'Canceled',
                  message: proof.message,
                  proofItems: proof.items,
                  mined: false,
                  txHash,
                })
                .then(() => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'canceled',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Cancelling this milestone is pending...
                      <br />
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

            // on chain
            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3()])
              .then(([network, web3]) => {
                etherScanUrl = network.etherscan;

                const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

                return cappedMilestone
                  .cancelMilestone({
                    from: this.props.currentUser.address,
                    $extraGas: extraGas(),
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    _cancelMilestone(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The milestone has been cancelled!
                    <br />
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
              .catch(err => {
                if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
                ErrorPopup(
                  'Something went wrong with the transaction.',
                  `${etherScanUrl}tx/${txHash}`,
                );
              });
          }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  acceptProposedMilestone(milestone) {
    checkBalance(this.props.balance)
      .then(() =>
        this.conversationModal.current
          .openModal({
            title: 'Accept proposed milestone',
            description:
              'Optionally explain why you accept this proposed milestone. Compliments are appreciated! This information will be publicly visible and emailed to the milestone owner.',
            textPlaceholder: 'Optionally explain why you accept this proposal...',
            required: false,
            cta: 'Accept proposal',
            enableAttachProof: false,
          })
          .then(proof => {
            // feathers
            const _createMilestone = (etherScanUrl, txHash) =>
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'Pending',
                  mined: false,
                  message: proof.message,
                  proofItems: proof.items,
                  txHash,
                })
                .then(() => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'accepted proposed milestone',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Accepting this milestone is pending...
                      <br />
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

            // on chain
            let txHash;
            let etherScanUrl;
            getNetwork()
              .then(network => {
                etherScanUrl = network.etherscan;

                const {
                  title,
                  maxAmount,
                  recipientAddress,
                  reviewerAddress,
                  ownerAddress, // TODO change this to managerAddress. There is no owner
                  campaignReviewerAddress,
                } = milestone;
                const parentProjectId = milestone.campaign.projectId;
                const from = this.props.currentUser.address;

                // TODO  fix this hack
                if (!parentProjectId || parentProjectId === '0') {
                  ErrorPopup(
                    `It looks like the campaign has not been mined yet. Please try again in a bit`,
                    `It looks like the campaign has not been mined yet. Please try again in a bit`,
                  );
                  return Promise.resolve();
                }

                return network.lppCappedMilestoneFactory
                  .newMilestone(
                    title,
                    '',
                    parentProjectId,
                    reviewerAddress,
                    recipientAddress,
                    campaignReviewerAddress,
                    ownerAddress,
                    maxAmount,
                    Object.values(config.tokenAddresses)[0], // TODO make this a form param
                    5 * 24 * 60 * 60, // 5 days in seconds
                    { from, $extraGas: extraGas() },
                  )
                  .on('transactionHash', hash => {
                    txHash = hash;

                    return _createMilestone(etherScanUrl, txHash);
                  });
              })
              .catch(err => {
                if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
                ErrorPopup(
                  'Something went wrong with the transaction.',
                  `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
                );
              });
          }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  approveMilestoneCompleted(milestone) {
    checkBalance(this.props.balance)
      .then(() =>
        this.conversationModal.current
          .openModal({
            title: 'Approve milestone completion',
            description:
              'Optionally explain why you approve the completion of this milestone. Compliments are appreciated! This information will be publicly visible and emailed to the milestone owner.',
            textPlaceholder:
              'Optionally explain why you approve the completion of this milestone...',
            required: false,
            cta: 'Approve completion',
            enableAttachProof: false,
          })
          .then(proof => {
            // feathers
            const _approveMilestoneCompleted = (etherScanUrl, txHash) =>
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'Completed',
                  mined: false,
                  message: proof.message,
                  proofItems: proof.items,
                  txHash,
                })
                .then(() => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'approved completion',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Approving this milestone is pending...
                      <br />
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

            // on chain
            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3()])
              .then(([network, web3]) => {
                etherScanUrl = network.etherscan;

                const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

                return cappedMilestone
                  .approveMilestoneCompleted({
                    from: this.props.currentUser.address,
                    $extraGas: extraGas(),
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    return _approveMilestoneCompleted(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The milestone has been approved!
                    <br />
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
              .catch(err => {
                if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
                ErrorPopup(
                  'Something went wrong with the transaction.',
                  `${etherScanUrl}tx/${txHash}`,
                );
              });
          }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  rejectMilestoneCompletion(milestone) {
    checkBalance(this.props.balance)
      .then(() =>
        this.conversationModal.current
          .openModal({
            title: 'Reject milestone completion',
            description:
              'Explain why you rejected the completion of this milestone. This information will be publicly visible and emailed to the milestone owner.',
            textPlaceholder: 'Explain why you rejected the completion of this milestone...',
            required: true,
            cta: 'Reject completion',
            enableAttachProof: false,
          })
          .then(proof => {
            // reject in feathers
            const _rejectMilestoneCompletion = (etherScanUrl, txHash) =>
              feathersClient
                .service('/milestones')
                .patch(milestone._id, {
                  status: 'InProgress',
                  mined: false,
                  message: proof.message,
                  proofItems: proof.items,
                  txHash,
                })
                .then(() => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'rejected completion',
                    label: milestone._id,
                  });
                  React.toast.info(<p>You have rejected this milestone&apos;s completion...</p>);
                })
                .catch(e => {
                  ErrorPopup('Something went wrong with the transaction.', e);
                });

            // reject on chain
            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3()])
              .then(([network, web3]) => {
                etherScanUrl = network.etherscan;

                const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

                return cappedMilestone
                  .rejectCompleteRequest({
                    from: this.props.currentUser.address,
                    $extraGas: extraGas(),
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    return _rejectMilestoneCompletion(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.success(
                  <p>
                    The milestone completion been rejected!
                    <br />
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
              .catch(err => {
                if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
                ErrorPopup(
                  'Something went wrong with the transaction.',
                  `${etherScanUrl}tx/${txHash}`,
                );
              });
          }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  withdrawal(milestone) {
    checkBalance(this.props.balance)
      .then(() =>
        React.swal({
          title: 'Withdrawal Funds to Wallet',
          content: React.swal.msg(
            <div>
              <p>We will initiate the transfer of the funds to your wallet.</p>
              <div className="alert alert-warning">
                Note: For security reasons, there is a delay of approximately 48 hrs before the
                funds will appear in your wallet.
              </div>
            </div>,
          ),
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, withdrawal'],
        }).then(isConfirmed => {
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
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'initiated withdrawal',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Withdrawal from milestone...
                      <br />
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
            };

            const getPledges = () =>
              feathersClient
                .service('donations')
                .find({
                  query: {
                    ownerType: 'milestone',
                    ownerTypeId: milestone._id,
                    amountRemaining: { $ne: 0 },
                    status: Donation.COMMITTED,
                  },
                })
                .then(({ data }) => {
                  if (data.length === 0) throw new Error('No donations found to withdraw');

                  const pledges = [];
                  data.forEach(donation => {
                    const pledge = pledges.find(n => n.id === donation.pledgeId);

                    if (pledge) {
                      pledge.amount = pledge.amount.add(utils.toBN(donation.amountRemaining));
                    } else {
                      pledges.push({
                        id: donation.pledgeId,
                        amount: utils.toBN(donation.amountRemaining),
                      });
                    }
                  });

                  return pledges.map(
                    pledge =>
                      // due to some issue in web3, utils.toHex(pledge.amount) breaks during minification.
                      // BN.toString(16) will return a hex string as well
                      `0x${utils.padLeft(pledge.amount.toString(16), 48)}${utils.padLeft(
                        utils.toHex(pledge.id).substring(2),
                        16,
                      )}`,
                  );
                });

            let txHash;
            let etherScanUrl;
            Promise.all([getNetwork(), getWeb3(), getPledges()])
              .then(([network, web3, pledges]) => {
                etherScanUrl = network.etherscan;

                return new LPPCappedMilestone(web3, milestone.pluginAddress)
                  .mWithdraw(pledges, {
                    from: this.props.currentUser.address,
                    $extraGas: extraGas(),
                  })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    withdraw(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.info(
                  <p>
                    The milestone withdraw has been initiated...
                    <br />
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
                if (txHash && e.message && e.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
                console.error(e); // eslint-disable-line no-console

                let msg;
                if (txHash) {
                  // TODO: need to update feathers to reset the donations to previous state as this
                  // tx failed.
                  msg = (
                    <p>
                      Something went wrong with the transaction.
                      <br />
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
                  msg = <p>Something went wrong with the transaction.</p>;
                }

                React.swal({
                  title: 'Oh no!',
                  content: React.swal.msg(msg),
                  icon: 'error',
                });
              });
          }
        }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
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
      <Web3Consumer>
        {({ state: { isForeignNetwork } }) => (
          <div id="milestones-view">
            <div className="container-fluid page-layout dashboard-table-view">
              <div className="row">
                <div className="col-md-10 m-auto">
                  <h1>Your milestones</h1>

                  <NetworkWarning
                    incorrectNetwork={!isForeignNetwork}
                    networkName={config.foreignNetworkName}
                  />

                  <ul className="nav nav-tabs">
                    {this.milestoneTabs.map(st => (
                      <li className="nav-item" key={st}>
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
                                  {currentUser.authenticated && <th className="td-actions" />}
                                  <th className="td-created-at">Created</th>
                                  <th className="td-name">Name</th>
                                  <th className="td-status">Status</th>
                                  <th className="td-donations-number">Requested</th>
                                  <th className="td-donations-number">Donations</th>
                                  <th className="td-donations-amount">Donated</th>
                                  <th className="td-reviewer">Reviewer</th>
                                </tr>
                              </thead>
                              <tbody>
                                {milestones.map(m => (
                                  <tr
                                    key={m._id}
                                    className={m.status === 'Pending' ? 'pending' : ''}
                                  >
                                    {currentUser.authenticated && (
                                      <td className="td-actions">
                                        {/* Campaign and Milestone managers can edit milestone */}
                                        {(m.ownerAddress === currentUser.address ||
                                          m.campaign.ownerAddress === currentUser.address) &&
                                          isForeignNetwork &&
                                          [
                                            'Proposed',
                                            'Rejected',
                                            'InProgress',
                                            'NeedsReview',
                                          ].includes(m.status) && (
                                            <button
                                              type="button"
                                              className="btn btn-link"
                                              onClick={() => this.editMilestone(m)}
                                            >
                                              <i className="fa fa-edit" />
                                              &nbsp;Edit
                                            </button>
                                          )}

                                        {m.campaign.ownerAddress === currentUser.address &&
                                          isForeignNetwork &&
                                          m.status === 'Proposed' && (
                                            <span>
                                              <button
                                                type="button"
                                                className="btn btn-success btn-sm"
                                                onClick={() => this.acceptProposedMilestone(m)}
                                              >
                                                <i className="fa fa-check-square-o" />
                                                &nbsp;Accept
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => rejectProposedMilestone(m)}
                                              >
                                                <i className="fa fa-times-circle-o" />
                                                &nbsp;Reject
                                              </button>
                                            </span>
                                          )}
                                        {m.ownerAddress === currentUser.address &&
                                          isForeignNetwork &&
                                          m.status === 'Rejected' && (
                                            <button
                                              type="button"
                                              className="btn btn-success btn-sm"
                                              onClick={() => reproposeRejectedMilestone(m)}
                                            >
                                              <i className="fa fa-times-square-o" />
                                              &nbsp;Re-propose
                                            </button>
                                          )}

                                        {(m.recipientAddress === currentUser.address ||
                                          m.ownerAddress === currentUser.address) &&
                                          isForeignNetwork &&
                                          m.status === 'InProgress' &&
                                          m.mined && (
                                            <button
                                              type="button"
                                              className="btn btn-success btn-sm"
                                              onClick={() => this.requestMarkComplete(m)}
                                              disabled={
                                                !utils.toBN(m.currentBalance || '0').gt('0')
                                              }
                                            >
                                              Mark complete
                                            </button>
                                          )}
                                        {[m.reviewerAddress, m.ownerAddress].includes(
                                          currentUser.address,
                                        ) &&
                                          isForeignNetwork &&
                                          ['InProgress', 'NeedReview'].includes(m.status) &&
                                          m.mined && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm"
                                              onClick={() => this.cancelMilestone(m)}
                                            >
                                              <i className="fa fa-times" />
                                              &nbsp;Cancel
                                            </button>
                                          )}

                                        {m.ownerAddress === currentUser.address &&
                                          isForeignNetwork &&
                                          ['Proposed', 'Rejected'].includes(m.status) && (
                                            <span>
                                              <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteProposedMilestone(m)}
                                              >
                                                <i className="fa fa-times-circle-o" />
                                                &nbsp;Delete
                                              </button>
                                            </span>
                                          )}

                                        {m.reviewerAddress === currentUser.address &&
                                          isForeignNetwork &&
                                          m.status === 'NeedsReview' &&
                                          m.mined && (
                                            <span>
                                              <button
                                                type="button"
                                                className="btn btn-success btn-sm"
                                                onClick={() => this.approveMilestoneCompleted(m)}
                                              >
                                                <i className="fa fa-thumbs-up" />
                                                &nbsp;Approve
                                              </button>

                                              <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => this.rejectMilestoneCompletion(m)}
                                              >
                                                <i className="fa fa-thumbs-down" />
                                                &nbsp;Reject
                                              </button>
                                            </span>
                                          )}

                                        {[m.recipientAddress, m.ownerAddress].includes(
                                          currentUser.address,
                                        ) &&
                                          m.status === 'Completed' &&
                                          isForeignNetwork &&
                                          m.mined &&
                                          m.peopleCount > 0 && (
                                            <button
                                              type="button"
                                              className="btn btn-success btn-sm"
                                              onClick={() => this.withdrawal(m)}
                                            >
                                              <i className="fa fa-usd" />{' '}
                                              {m.recipientAddress === currentUser.address
                                                ? 'Collect'
                                                : 'Disburse'}
                                            </button>
                                          )}

                                        {/* {m.recipientAddress === currentUser.address &&
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
                                      )} */}
                                      </td>
                                    )}

                                    <td className="td-created-at">
                                      {m.createdAt && (
                                        <span>{moment.utc(m.createdAt).format('Do MMM YYYY')}</span>
                                      )}
                                    </td>
                                    <td className="td-name">
                                      <strong>
                                        <Link
                                          to={`/campaigns/${m.campaign._id}/milestones/${m._id}`}
                                        >
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
                                      {(m.status === 'Pending' ||
                                        (Object.keys(m).includes('mined') && !m.mined)) && (
                                        <span>
                                          <i className="fa fa-circle-o-notch fa-spin" />
                                          &nbsp;
                                        </span>
                                      )}
                                      {m.status === 'NeedsReview' &&
                                        reviewDue(m.updatedAt) && (
                                          <span>
                                            <i className="fa fa-exclamation-triangle" />
                                            &nbsp;
                                          </span>
                                        )}
                                      {getReadableStatus(m.status)}
                                    </td>
                                    <td className="td-donations-number">
                                      {convertEthHelper(m.maxAmount)} {m.token.symbol}
                                    </td>
                                    <td className="td-donations-number">
                                      {(m.donationCounters &&
                                        m.donationCounters.length &&
                                        m.donationCounters[0].donationCount) ||
                                        0}
                                    </td>
                                    <td className="td-donations-">
                                      {convertEthHelper(
                                        (m.donationCounters &&
                                          m.donationCounters.length &&
                                          m.donationCounters[0].currentBalance) ||
                                          '0',
                                      )}{' '}
                                      {m.token.symbol}
                                    </td>
                                    <td className="td-reviewer">
                                      {m.reviewer &&
                                        m.reviewer.address && (
                                          <Link to={`/profile/${m.reviewer.address}`}>
                                            {m.reviewer.name || 'Anomynous user'}
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
                                  onChange={this.handlePageChanged}
                                />
                              </center>
                            )}
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

            <ConversationModal ref={this.conversationModal} />
          </div>
        )}
      </Web3Consumer>
    );
  }
}

MyMilestones.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.objectOf(utils.BN).isRequired,
};

export default MyMilestones;
