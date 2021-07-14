import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import { authenticateUser, checkBalance } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as NotificationContext } from '../contextProviders/NotificationModalProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';

const RequestMarkTraceCompleteButton = ({ trace, isAmountEnoughForWithdraw }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    actions: { minPayoutWarningInMarkComplete },
  } = useContext(NotificationContext);

  const conversationModal = useRef();

  const requestMarkComplete = () => {
    const userAddress = currentUser.address;

    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance)
        .then(async () => {
          if (!isAmountEnoughForWithdraw) {
            minPayoutWarningInMarkComplete();
            return;
          }

          if (trace.donationCounters.length === 0) {
            const proceed = await React.swal({
              title: 'Mark Trace Complete?',
              text:
                'Are you sure you want to mark this Trace as complete? You have yet to receive any donations.',
              icon: 'warning',
              dangerMode: true,
              buttons: ['Cancel', 'Yes'],
            });

            // if null, then "Cancel" was pressed
            if (proceed === null) return;
          }

          conversationModal.current
            .openModal({
              title: 'Mark Trace complete',
              description:
                "Describe what you've done to finish the work of this Trace and attach proof if necessary. This information will be publicly visible and emailed to the reviewer.",
              required: false,
              cta: 'Mark Complete',
              enableAttachProof: true,
              textPlaceholder: "Describe what you've done...",
            })
            .then(proof => {
              TraceService.requestMarkComplete({
                trace,
                from: userAddress,
                proof,
                onTxHash: txUrl => {
                  sendAnalyticsTracking('Trace Marked Complete', {
                    category: 'Trace',
                    action: 'marked complete',
                    label: trace._id,
                    title: trace.title,
                    userAddress: currentUser.address,
                    txUrl,
                  });

                  React.toast.info(
                    <p>
                      Marking this Trace as complete is pending...
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
                      The Trace has been marked as complete!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with marking your Trace as complete', err);
                  } else {
                    ErrorPopup(
                      'Something went wrong with the transaction.',
                      `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                    );
                  }
                },
                web3,
              });
            });
        })
        .catch(console.error);
    });
  };

  return (
    <Fragment>
      {trace.canUserMarkComplete(currentUser) && (
        // {currentBalanceValue && trace.canUserMarkComplete(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() =>
            isForeignNetwork ? requestMarkComplete() : displayForeignNetRequiredWarning()
          }
        >
          Mark Complete
        </button>
      )}

      <ConversationModal ref={conversationModal} />
    </Fragment>
  );
};

RequestMarkTraceCompleteButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(RequestMarkTraceCompleteButton);
