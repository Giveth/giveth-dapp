import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class RequestMarkMilestoneCompleteButton extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  requestMarkComplete() {
    const { milestone, balance, currentUser } = this.props;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(async () => {
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

          this.conversationModal.current
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
                from: currentUser.address,
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
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork }, actions: { displayForeignNetRequiredWarning } }) => (
          <Fragment>
            {milestone.canUserMarkComplete(currentUser) && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() =>
                  isForeignNetwork ? this.requestMarkComplete() : displayForeignNetRequiredWarning()
                }
              >
                Mark complete
              </button>
            )}

            <ConversationModal ref={this.conversationModal} milestone={milestone} />
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

RequestMarkMilestoneCompleteButton.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

RequestMarkMilestoneCompleteButton.defaultProps = {
  currentUser: undefined,
};

export default RequestMarkMilestoneCompleteButton;
