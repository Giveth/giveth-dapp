import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { checkBalance } from 'lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class RequestMarkMilestoneCompleteButton extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  requestMarkComplete() {
    const { milestone, balance, currentUser } = this.props;

    checkBalance(balance)
      .then(() => {
        this.conversationModal.current
          .openModal({
            title: 'Mark milestone complete',
            description:
              "Describe what you've done to finish the work of this milestone and attach proof if necessary. This information will be publicly visible and emailed to the reviewer.",
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
                    Marking this milestone as complete is pending...
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
                    The milestone has been marked as complete!
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onError: (err, txUrl) => {
                if (err === 'patch-error') {
                  ErrorPopup('Something went wrong with marking your milestone as complete', err);
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
            {(milestone.recipient.address === currentUser.address ||
              milestone.ownerAddress === currentUser.address) &&
              milestone.status === 'InProgress' &&
              milestone.mined && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => this.requestMarkComplete()}
                  disabled={!(milestone.currentBalance || '0').gt('0') || !isForeignNetwork}
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
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default RequestMarkMilestoneCompleteButton;
