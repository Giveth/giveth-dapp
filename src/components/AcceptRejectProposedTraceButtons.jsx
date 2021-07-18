import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import ErrorPopup from 'components/ErrorPopup';
import { authenticateUser, checkBalance } from 'lib/middleware';
import ConversationModal from 'components/ConversationModal';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';

const AcceptRejectProposedTraceButtons = ({ trace }) => {
  const conversationModal = useRef();
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { balance, isForeignNetwork, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const rejectProposedTrace = async () => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      conversationModal.current
        .openModal({
          title: 'Reject proposed Trace',
          description:
            'Optionally explain why you reject this proposed Trace. This information will be publicly visible and emailed to the Trace owner.',
          textPlaceholder: 'Optionally explain why you reject this proposal...',
          required: false,
          cta: 'Reject proposal',
          enableAttachProof: false,
        })
        .then(proof => {
          TraceService.rejectProposedTrace({
            trace,
            message: proof.message,
            onSuccess: () => React.toast.info(<p>The proposed Trace has been rejected.</p>),
            onError: e => ErrorPopup('Something went wrong with rejecting the proposed Trace', e),
          });
        });
    });
  };

  const acceptProposedTrace = async () => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance)
        .then(() =>
          conversationModal.current
            .openModal({
              title: 'Accept proposed Trace',
              description:
                'Your acceptance of this Trace will be recorded as a publicly visible comment, and emailed to the Trace Owner. Please add a personal comment, compliment or other custom message to accompany it!',
              required: false,
              cta: 'Submit',
              enableAttachProof: false,
              type: 'AcceptProposed',
            })
            .then(proof => {
              TraceService.acceptProposedTrace({
                trace,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  // done
                  sendAnalyticsTracking('Trace Accepted', {
                    category: 'Trace',
                    action: 'accepted proposed Trace',
                    traceId: trace._id,
                    title: trace.title,
                    ownerId: trace.ownerAddress,
                    traceType: trace.formType,
                    traceRecipientAddress: trace.recipientAddress,
                    parentCampaignId: trace.campaign.id,
                    parentCampaignTitle: trace.campaign.title,
                    reviewerAddress: trace.reviewerAddress,
                    userAddress: currentUser.address,
                    txUrl,
                  });

                  React.toast.info(
                    <p>
                      Accepting this Trace is pending...
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
                      The Trace has been accepted!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with accepting this proposed Trace', err);
                  } else {
                    ErrorPopup(
                      'Something went wrong with the transaction.',
                      `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                    );
                  }
                },
                web3,
              });
            }),
        )
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        });
    });
  };

  return (
    <Fragment>
      {trace.canUserAcceptRejectProposal(currentUser) && (
        <span>
          <button
            type="button"
            className="btn btn-success btn-sm m-1"
            onClick={() =>
              isForeignNetwork ? acceptProposedTrace() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-check-square-o" />
            &nbsp;Accept
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm m-1"
            onClick={() =>
              isForeignNetwork ? rejectProposedTrace() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-times-circle-o" />
            &nbsp;Reject
          </button>
        </span>
      )}

      <ConversationModal ref={conversationModal} trace={trace} />
    </Fragment>
  );
};

AcceptRejectProposedTraceButtons.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(AcceptRejectProposedTraceButtons);
