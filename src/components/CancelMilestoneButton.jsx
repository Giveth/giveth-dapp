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

class CancelMilestoneButton extends Component {
  constructor(props) {
    super(props);
    this.conversationModal = React.createRef();
  }

  cancelMilestone() {
    const { milestone, balance, currentUser } = this.props;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(() =>
          this.conversationModal.current
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
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork }, actions: { displayForeignNetRequiredWarning } }) => (
          <Fragment>
            {milestone.canUserCancel(currentUser) && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() =>
                  isForeignNetwork ? this.cancelMilestone() : displayForeignNetRequiredWarning()
                }
              >
                <i className="fa fa-times" />
                &nbsp;Cancel
              </button>
            )}

            <ConversationModal ref={this.conversationModal} milestone={milestone} />
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

CancelMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

CancelMilestoneButton.defaultProps = {
  currentUser: undefined,
};

export default CancelMilestoneButton;
