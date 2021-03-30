import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const RequestMarkMilestoneCompleteButton = ({
  milestone,
  isAmountEnoughForWithdraw,
  minimumPayoutUsdValue,
}) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const conversationModal = useRef();

  const requestMarkComplete = () => {
    const userAddress = currentUser.address;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(async () => {
          if (!isAmountEnoughForWithdraw) {
            ErrorPopup(
              `Oh No!
        A minimum donation balance of ${minimumPayoutUsdValue} USD is required
        before you can mark this milestone complete. This is a temporary
        limitation due to Ethereum Mainnet issues.`,
            );
            return;
          }

          if (milestone.donationCounters.length === 0) {
            const proceed = await React.swal({
              title: 'Mark Milestone Complete?',
              text:
                'Are you sure you want to mark this Milestone as complete? You have yet to receive any donations.',
              icon: 'warning',
              dangerMode: true,
              buttons: ['Cancel', 'Yes'],
            });

            // if null, then "Cancel" was pressed
            if (proceed === null) return;
          }

          conversationModal.current
            .openModal({
              title: 'Mark Milestone complete',
              description:
                "Describe what you've done to finish the work of this Milestone and attach proof if necessary. This information will be publicly visible and emailed to the reviewer.",
              required: false,
              cta: 'Mark complete',
              enableAttachProof: true,
              textPlaceholder: "Describe what you've done...",
            })
            .then(proof => {
              MilestoneService.requestMarkComplete({
                milestone,
                from: userAddress,
                proof,
                onTxHash: txUrl => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'marked complete',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Marking this Milestone as complete is pending...
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
                      The Milestone has been marked as complete!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with marking your Milestone as complete', err);
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
        .catch(console.error),
    );
  };

  return (
    <Fragment>
      {milestone.canUserMarkComplete(currentUser) && (
        // {currentBalanceValue && milestone.canUserMarkComplete(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() =>
            isForeignNetwork ? requestMarkComplete() : displayForeignNetRequiredWarning()
          }
        >
          Mark complete
        </button>
      )}

      <ConversationModal ref={conversationModal} milestone={milestone} />
    </Fragment>
  );
};

RequestMarkMilestoneCompleteButton.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  minimumPayoutUsdValue: PropTypes.number.isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(RequestMarkMilestoneCompleteButton);
