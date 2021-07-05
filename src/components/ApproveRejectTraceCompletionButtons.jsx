import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import Trace from 'models/Trace';
import TraceService from 'services/TraceService';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

const ApproveRejectTraceCompletionButtons = ({ trace }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const conversationModal = useRef();

  const approveTraceCompleted = async () => {
    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() => {
          conversationModal.current
            .openModal({
              title: 'Approve Trace completion',
              description:
                'Optionally explain why you approve the completion of this Trace. Compliments are appreciated! This information will be publicly visible and emailed to the Trace owner.',
              textPlaceholder: 'Optionally explain why you approve the completion of this Trace...',
              required: false,
              cta: 'Approve completion',
              enableAttachProof: false,
            })
            .then(proof => {
              TraceService.approveTraceCompletion({
                trace,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  window.analytics.track('Approved Trace', {
                    category: 'Trace',
                    action: 'approved',
                    userAddress: currentUser.address,
                    id: trace._id,
                    title: trace.title,
                    txUrl,
                  });

                  React.toast.info(
                    <p>
                      Approving this Trace is pending...
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
                      The Trace has been approved!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup("Something went wrong with approving this Trace's completion", err);
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

  const rejectTraceCompleted = async () => {
    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() => {
          conversationModal.current
            .openModal({
              title: 'Reject Trace completion',
              description:
                'Explain why you rejected the completion of this Trace. This information will be publicly visible and emailed to the Trace owner.',
              textPlaceholder: 'Explain why you rejected the completion of this Trace...',
              required: true,
              cta: 'Reject completion',
              enableAttachProof: false,
            })
            .then(proof => {
              TraceService.rejectTraceCompletion({
                trace,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  window.analytics.track('Trace Rejected', {
                    category: 'Trace',
                    action: 'rejected completion',
                    id: trace._id,
                    title: trace.title,
                    userAddress: currentUser.address,
                  });

                  React.toast.info(
                    <p>
                      Rejecting this Trace&apos;s completion is pending...
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
                      The Trace&apos;s completion has been rejected.
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup("Something went wrong with rejecting this Trace's completion", err);
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
      {trace.canUserApproveRejectCompletion(currentUser) && (
        <span>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() =>
              isForeignNetwork ? approveTraceCompleted() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-thumbs-up" />
            &nbsp;Approve
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() =>
              isForeignNetwork ? rejectTraceCompleted() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-thumbs-down" />
            &nbsp;Reject Completion
          </button>
        </span>
      )}

      <ConversationModal ref={conversationModal} trace={trace} />
    </Fragment>
  );
};

ApproveRejectTraceCompletionButtons.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(ApproveRejectTraceCompletionButtons);
