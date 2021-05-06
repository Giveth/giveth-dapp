import React, { forwardRef, Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { actionWithLoggedIn, checkBalance } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';

const CancelMilestoneButton = forwardRef(({ milestone }, ref) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const conversationModal = useRef();

  const openDialog = () => {
    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() =>
          conversationModal.current
            .openModal({
              title: 'Cancel Milestone',
              description:
                'Explain why you cancel this Milestone. Compliments are appreciated! This information will be publicly visible and emailed to the Milestone owner.',
              textPlaceholder: 'Explain why you cancel this Milestone...',
              required: true,
              cta: 'Cancel Milestone',
              enableAttachProof: false,
            })
            .then(proof =>
              MilestoneService.cancelMilestone({
                milestone,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'canceled',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Canceling this Milestone is pending...
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
                      The Milestone has been cancelled!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with canceling your Milestone', err);
                  } else {
                    ErrorPopup(
                      'Something went wrong with the transaction.',
                      `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                    );
                  }
                },
              }),
            ),
        )
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
      {milestone.canUserCancel(currentUser) && (
        <button
          ref={ref}
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => (isForeignNetwork ? openDialog() : displayForeignNetRequiredWarning())}
        >
          <i className="fa fa-times" />
          &nbsp;Cancel
        </button>
      )}

      <ConversationModal ref={conversationModal} milestone={milestone} />
    </Fragment>
  );
});

CancelMilestoneButton.propTypes = {
  milestone: PropTypes.oneOfType(
    [Milestone, BridgedMilestone, LPPCappedMilestone, LPMilestone].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(CancelMilestoneButton);
