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
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class ApproveRejectMilestoneCompletionButtons extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  async approveMilestoneCompleted() {
    const { milestone, currentUser, balance } = this.props;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() => {
          this.conversationModal.current
            .openModal({
              title: 'Approve Milestone completion',
              description:
                'Optionally explain why you approve the completion of this Milestone. Compliments are appreciated! This information will be publicly visible and emailed to the Milestone owner.',
              textPlaceholder:
                'Optionally explain why you approve the completion of this Milestone...',
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
                      Approving this Milestone is pending...
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
                      The Milestone has been approved!
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
                      "Something went wrong with approving this Milestone's completion",
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
            })
            .catch(_ => {});
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        }),
    );
  }

  async rejectMilestoneCompleted() {
    const { milestone, currentUser, balance } = this.props;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() => {
          this.conversationModal.current
            .openModal({
              title: 'Reject Milestone completion',
              description:
                'Explain why you rejected the completion of this Milestone. This information will be publicly visible and emailed to the Milestone owner.',
              textPlaceholder: 'Explain why you rejected the completion of this Milestone...',
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
                      Rejecting this Milestone's completion is pending...
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
                      The Milestone's completion has been rejected.
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
                      "Something went wrong with rejecting this Milestone's completion",
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
            })
            .catch(_ => {});
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        }),
    );
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork }, actions: { displayForeignNetRequiredWarning } }) => (
          <Fragment>
            {milestone.canUserApproveRejectCompletion(currentUser) && (
              <span>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() =>
                    isForeignNetwork
                      ? this.approveMilestoneCompleted()
                      : displayForeignNetRequiredWarning()
                  }
                >
                  <i className="fa fa-thumbs-up" />
                  &nbsp;Approve
                </button>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    isForeignNetwork
                      ? this.rejectMilestoneCompleted()
                      : displayForeignNetRequiredWarning()
                  }
                >
                  <i className="fa fa-thumbs-down" />
                  &nbsp;Reject Completion
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
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

ApproveRejectMilestoneCompletionButtons.defaultProps = {
  currentUser: undefined,
};

export default ApproveRejectMilestoneCompletionButtons;
