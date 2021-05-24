/* eslint-disable react/prefer-stateless-function */
// @dev: not prefering stateless here because functionality will be extended
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import DeleteProposedTraceButton from 'components/DeleteProposedTraceButton';
import AcceptRejectProposedTraceButtons from 'components/AcceptRejectProposedTraceButtons';
import ReproposeRejectedTraceButton from 'components/ReproposeRejectedTraceButton';
import RequestMarkTraceCompleteButton from 'components/RequestMarkTraceCompleteButton';
import ApproveRejectTraceCompletionButtons from 'components/ApproveRejectTraceCompletionButtons';
import WithdrawTraceFundsButton from 'components/WithdrawTraceFundsButton';
import Trace from '../models/Trace';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

class TraceConversationAction extends Component {
  render() {
    const { messageContext, trace, isAmountEnoughForWithdraw } = this.props;

    switch (messageContext) {
      case 'proposed':
        return <AcceptRejectProposedTraceButtons trace={trace} />;

      case 'rejected':
        return (
          <RequestMarkTraceCompleteButton
            trace={trace}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        );

      case 'NeedsReview':
        return <ApproveRejectTraceCompletionButtons trace={trace} />;

      case 'Completed':
        return (
          <WithdrawTraceFundsButton
            trace={trace}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        );

      case 'proposedRejected':
        return (
          <Fragment>
            <ReproposeRejectedTraceButton trace={trace} />
            <DeleteProposedTraceButton trace={trace} />
          </Fragment>
        );

      case 'proposedAccepted':
        return (
          <RequestMarkTraceCompleteButton
            trace={trace}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        );
      default:
        return <Fragment />;
    }
  }
}

TraceConversationAction.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  messageContext: PropTypes.string.isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(TraceConversationAction);
