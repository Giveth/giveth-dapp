import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import { checkBalance } from 'lib/middleware';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class AcceptRejectProposedMilestoneButtons extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  rejectProposedMilestone() {
    React.swal({
      title: 'Reject Milestone?',
      text: 'Are you sure you want to reject this Milestone?',
      icon: 'warning',
      dangerMode: true,
      buttons: ['Cancel', 'Yes, reject'],
      content: {
        element: 'input',
        attributes: {
          placeholder: 'Add a reason why you reject this proposed milestone...',
        },
      },
    }).then(rejectReason => {
      MilestoneService.rejectProposedMilestone({
        milestone: this.props.milestone,
        rejectReason,
        onSuccess: () => React.toast.info(<p>The proposed milestone has been rejected.</p>),
        onError: e => ErrorPopup('Something went wrong with rejecting the proposed milestone', e),
      });
    });
  }

  acceptProposedMilestone() {
    const { milestone, currentUser } = this.props;

    checkBalance(this.props.balance)
      .then(() =>
        this.conversationModal.current
          .openModal({
            title: 'Accept proposed milestone',
            description:
              'Optionally explain why you accept this proposed milestone. Compliments are appreciated! This information will be publicly visible and emailed to the milestone owner.',
            textPlaceholder: 'Optionally explain why you accept this proposal...',
            required: false,
            cta: 'Accept proposal',
            enableAttachProof: false,
          })
          .then(proof => {
            MilestoneService.acceptProposedMilestone({
              milestone,
              from: currentUser.address,
              proof,
              onTxHash: txUrl => {
                GA.trackEvent({
                  category: 'Milestone',
                  action: 'accepted proposed milestone',
                  label: milestone._id,
                });

                React.toast.info(
                  <p>
                    Accepting this milestone is pending...
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
                    The milestone has been accepted!
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onError: (err, txUrl) => {
                if (err === 'patch-error') {
                  ErrorPopup('Something went wrong with accepting this proposed milestone', err);
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
            {milestone.campaign.ownerAddress === currentUser.address &&
              milestone.status === 'Proposed' && (
                <span>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => this.acceptProposedMilestone()}
                    disabled={!isForeignNetwork}
                  >
                    <i className="fa fa-check-square-o" />
                    &nbsp;Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => this.rejectProposedMilestone()}
                    disabled={!isForeignNetwork}
                  >
                    <i className="fa fa-times-circle-o" />
                    &nbsp;Reject
                  </button>
                </span>
              )}

            <ConversationModal ref={this.conversationModal} milestone={milestone} />
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

AcceptRejectProposedMilestoneButtons.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default AcceptRejectProposedMilestoneButtons;
