/* eslint-disable react/prefer-stateless-function */
// @dev: not prefering stateless here because functionality will be extended
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import User from 'models/User';
import BigNumber from 'bignumber.js';

import DeleteProposedMilestoneButton from 'components/DeleteProposedMilestoneButton';
import AcceptRejectProposedMilestoneButtons from 'components/AcceptRejectProposedMilestoneButtons';
import ReproposeRejectedMilestoneButton from 'components/ReproposeRejectedMilestoneButton';
import RequestMarkMilestoneCompleteButton from 'components/RequestMarkMilestoneCompleteButton';
import ApproveRejectMilestoneCompletionButtons from 'components/ApproveRejectMilestoneCompletionButtons';
import WithdrawMilestoneFundsButton from 'components/WithdrawMilestoneFundsButton';

class MilestoneConversationAction extends Component {
  render() {
    const { messageContext, milestone, balance, currentUser } = this.props;

    switch (messageContext) {
      case 'proposed':
        return (
          <AcceptRejectProposedMilestoneButtons
            milestone={milestone}
            balance={balance}
            currentUser={currentUser}
          />
        );

      case 'rejected':
        return (
          <RequestMarkMilestoneCompleteButton
            milestone={milestone}
            balance={balance}
            currentUser={currentUser}
          />
        );

      case 'NeedsReview':
        return (
          <ApproveRejectMilestoneCompletionButtons
            milestone={milestone}
            balance={balance}
            currentUser={currentUser}
          />
        );

      case 'Completed':
        return (
          <WithdrawMilestoneFundsButton
            milestone={milestone}
            balance={balance}
            currentUser={currentUser}
          />
        );

      case 'proposedRejected':
        return (
          <Fragment>
            <ReproposeRejectedMilestoneButton
              milestone={milestone}
              balance={balance}
              currentUser={currentUser}
            />
            <DeleteProposedMilestoneButton
              milestone={milestone}
              balance={balance}
              currentUser={currentUser}
            />
          </Fragment>
        );

      case 'proposedAccepted':
        return (
          <RequestMarkMilestoneCompleteButton
            milestone={milestone}
            balance={balance}
            currentUser={currentUser}
          />
        );
      default:
        return <Fragment />;
    }
  }
}

MilestoneConversationAction.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  messageContext: PropTypes.string.isRequired,
};

MilestoneConversationAction.defaultProps = {
  currentUser: undefined,
};

export default MilestoneConversationAction;
