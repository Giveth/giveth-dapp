import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import MilestoneService from 'services/MilestoneService';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const ApproveRejectMilestoneCompletionButtons = ({ milestone }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const conversationModal = useRef();

  const approveMilestoneCompleted = async () => {
    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() => {
          conversationModal.current
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
  };

  const rejectMilestoneCompleted = async () => {
    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() => {
          conversationModal.current
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
                      Rejecting this Milestone&apos;s completion is pending...
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
                      The Milestone&apos;s completion has been rejected.
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
  };

  return (
    <Fragment>
      {milestone.canUserApproveRejectCompletion(currentUser) && (
        <span>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() =>
              isForeignNetwork ? approveMilestoneCompleted() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-thumbs-up" />
            &nbsp;Approve
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() =>
              isForeignNetwork ? rejectMilestoneCompleted() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-thumbs-down" />
            &nbsp;Reject Completion
          </button>
        </span>
      )}

      <ConversationModal ref={conversationModal} milestone={milestone} />
    </Fragment>
  );
};

ApproveRejectMilestoneCompletionButtons.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default React.memo(ApproveRejectMilestoneCompletionButtons);
