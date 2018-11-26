/* eslint-disable react/no-unescaped-entities */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import Milestone from 'models/Milestone';
import User from 'models/User';
import MilestoneService from 'services/MilestoneService';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { checkBalance } from 'lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class ApproveRejectMilestoneCompletionButtons extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  approveMilestoneCompleted() {
    const { milestone, currentUser, balance } = this.props;

    checkBalance(balance)
      .then(() => {
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
            MilestoneService.approveMilestoneCompletion({
              milestone,
              from: currentUser.address,
              proof,
              onTxHash: txUrl => {
                GA.trackEvent({
                  category: 'Milestone',
                  action: 'approved completion',
                  label: milestone._id,
                });

                React.toast.info(
                  <p>
                    Approving this milestone is pending...
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onConfirmation: txUrl => {
                React.toast.success(
                  <p>
                    The milestone has been approved!
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onError: (err, txUrl) => {
                if (err === 'patch-error') {
                  ErrorPopup(
                    "Something went wrong with approving this milestone's completion",
                    err,
                  );
                } else {
                  ErrorPopup(
                    'Something went wrong with the transaction.',
                    `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                  );
                }
              },
            });
          });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  rejectMilestoneCompleted() {
    const { milestone, currentUser } = this.props;

    checkBalance(this.props.balance)
      .then(() => {
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
            MilestoneService.rejectMilestoneCompletion({
              milestone,
              from: currentUser.address,
              proof,
              onTxHash: txUrl => {
                GA.trackEvent({
                  category: 'Milestone',
                  action: 'rejected completion',
                  label: milestone._id,
                });

                React.toast.info(
                  <p>
                    Rejecting this milestone's completion is pending...
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onConfirmation: txUrl => {
                React.toast.success(
                  <p>
                    The milestone's completion has been rejected.
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onError: (err, txUrl) => {
                if (err === 'patch-error') {
                  ErrorPopup(
                    "Something went wrong with rejecting this milestone's completion",
                    err,
                  );
                } else {
                  ErrorPopup(
                    'Something went wrong with the transaction.',
                    `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                  );
                }
              },
            });
          });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork } }) => (
          <Fragment>
            {milestone.reviewer.address === currentUser.address &&
              milestone.status === 'NeedsReview' &&
              milestone.mined && (
                <span>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => this.approveMilestoneCompleted()}
                    disabled={!isForeignNetwork}
                  >
                    <i className="fa fa-thumbs-up" />
                    &nbsp;Approve
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => this.rejectMilestoneCompleted()}
                    disabled={!isForeignNetwork}
                  >
                    <i className="fa fa-thumbs-down" />
                    &nbsp;Reject
                  </button>
                </span>
              )}

            <ConversationModal ref={this.conversationModal} milestone={milestone} />
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

ApproveRejectMilestoneCompletionButtons.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default ApproveRejectMilestoneCompletionButtons;
