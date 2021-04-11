/* eslint-disable react/prefer-stateless-function */
// @dev: not prefering stateless here because functionality will be extended
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';

import DeleteProposedMilestoneButton from 'components/DeleteProposedMilestoneButton';
import AcceptRejectProposedMilestoneButtons from 'components/AcceptRejectProposedMilestoneButtons';
import ReproposeRejectedMilestoneButton from 'components/ReproposeRejectedMilestoneButton';
import RequestMarkMilestoneCompleteButton from 'components/RequestMarkMilestoneCompleteButton';
import ApproveRejectMilestoneCompletionButtons from 'components/ApproveRejectMilestoneCompletionButtons';
import WithdrawMilestoneFundsButton from 'components/WithdrawMilestoneFundsButton';

class MilestoneConversationAction extends Component {
  render() {
    const { messageContext, milestone, isAmountEnoughForWithdraw } = this.props;

    switch (messageContext) {
      case 'proposed':
        return <AcceptRejectProposedMilestoneButtons milestone={milestone} />;

      case 'rejected':
        return (
          <RequestMarkMilestoneCompleteButton
            milestone={milestone}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        );

      case 'NeedsReview':
        return <ApproveRejectMilestoneCompletionButtons milestone={milestone} />;

      case 'Completed':
        return (
          <WithdrawMilestoneFundsButton
            milestone={milestone}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        );

      case 'proposedRejected':
        return (
          <Fragment>
            <ReproposeRejectedMilestoneButton milestone={milestone} />
            <DeleteProposedMilestoneButton milestone={milestone} />
          </Fragment>
        );

      case 'proposedAccepted':
        return (
          <RequestMarkMilestoneCompleteButton
            milestone={milestone}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        );
      default:
        return <Fragment />;
    }
  }
}

MilestoneConversationAction.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  messageContext: PropTypes.string.isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(MilestoneConversationAction);
