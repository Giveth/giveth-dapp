import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import ErrorPopup from 'components/ErrorPopup';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';

const AcceptRejectProposedMilestoneButtons = ({ milestone }) => {
  const conversationModal = useRef();
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { balance, isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const rejectProposedMilestone = async () => {
    actionWithLoggedIn(currentUser).then(() =>
      conversationModal.current
        .openModal({
          title: 'Reject proposed Milestone',
          description:
            'Optionally explain why you reject this proposed Milestone. This information will be publicly visible and emailed to the Milestone owner.',
          textPlaceholder: 'Optionally explain why you reject this proposal...',
          required: false,
          cta: 'Reject proposal',
          enableAttachProof: false,
        })
        .then(proof => {
          MilestoneService.rejectProposedMilestone({
            milestone,
            message: proof.message,
            onSuccess: () => React.toast.info(<p>The proposed Milestone has been rejected.</p>),
            onError: e =>
              ErrorPopup('Something went wrong with rejecting the proposed Milestone', e),
          });
        }),
    );
  };

  const acceptProposedMilestone = async () => {
    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() =>
          conversationModal.current
            .openModal({
              title: 'Accept proposed Milestone',
              description:
                'Your acceptance of this Milestone will be recorded as a publicly visible comment, and emailed to the Milestone Owner. Please add a personal comment, compliment or other custom message to accompany it!',
              required: false,
              cta: 'Submit',
              enableAttachProof: false,
              type: 'AcceptProposed',
            })
            .then(proof => {
              MilestoneService.acceptProposedMilestone({
                milestone,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  GA.trackEvent({
                    category: 'Milestone',
                    action: 'accepted proposed Milestone',
                    label: milestone._id,
                  });

                  React.toast.info(
                    <p>
                      Accepting this Milestone is pending...
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
                      The Milestone has been accepted!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with accepting this proposed Milestone', err);
                  } else {
                    ErrorPopup(
                      'Something went wrong with the transaction.',
                      `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                    );
                  }
                },
              });
            }),
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
      {milestone.canUserAcceptRejectProposal(currentUser) && (
        <span>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() =>
              isForeignNetwork ? acceptProposedMilestone() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-check-square-o" />
            &nbsp;Accept
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() =>
              isForeignNetwork ? rejectProposedMilestone() : displayForeignNetRequiredWarning()
            }
          >
            <i className="fa fa-times-circle-o" />
            &nbsp;Reject
          </button>
        </span>
      )}

      <ConversationModal ref={conversationModal} milestone={milestone} />
    </Fragment>
  );
};

AcceptRejectProposedMilestoneButtons.propTypes = {
  milestone: PropTypes.oneOfType(
    [Milestone, BridgedMilestone, LPPCappedMilestone, LPMilestone].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(AcceptRejectProposedMilestoneButtons);
