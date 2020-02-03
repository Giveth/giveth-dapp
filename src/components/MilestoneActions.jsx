/* eslint-disable react/prefer-stateless-function */
// @dev: not preferring stateless here because functionality will be extended
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import User from 'models/User';
import BigNumber from 'bignumber.js';

import DeleteProposedMilestoneButton from 'components/DeleteProposedMilestoneButton';
import AcceptRejectProposedMilestoneButtons from 'components/AcceptRejectProposedMilestoneButtons';
import ArchiveMilestoneButton from 'components/ArchiveMilestoneButton';
import ReproposeRejectedMilestoneButton from 'components/ReproposeRejectedMilestoneButton';
import RequestMarkMilestoneCompleteButton from 'components/RequestMarkMilestoneCompleteButton';
import CancelMilestoneButton from 'components/CancelMilestoneButton';
import ApproveRejectMilestoneCompletionButtons from 'components/ApproveRejectMilestoneCompletionButtons';
import WithdrawMilestoneFundsButton from 'components/WithdrawMilestoneFundsButton';
import EditMilestoneButton from 'components/EditMilestoneButton';
import ChangeMilestoneRecipientButton from './ChangeMilestoneRecipientButton';

class MilestoneActions extends Component {
  render() {
    const { milestone, balance, currentUser } = this.props;

    return (
      <Fragment>
        <AcceptRejectProposedMilestoneButtons
          milestone={milestone}
          balance={balance}
          currentUser={currentUser}
        />

        <ReproposeRejectedMilestoneButton milestone={milestone} currentUser={currentUser} />

        {milestone.hasRecipient ? (
          <RequestMarkMilestoneCompleteButton
            milestone={milestone}
            balance={balance}
            currentUser={currentUser}
          />
        ) : null}

        <ArchiveMilestoneButton milestone={milestone} balance={balance} currentUser={currentUser} />

        <ChangeMilestoneRecipientButton
          milestone={milestone}
          balance={balance}
          currentUser={currentUser}
        />

        <CancelMilestoneButton milestone={milestone} balance={balance} currentUser={currentUser} />

        <DeleteProposedMilestoneButton
          milestone={milestone}
          balance={balance}
          currentUser={currentUser}
        />

        <ApproveRejectMilestoneCompletionButtons
          milestone={milestone}
          balance={balance}
          currentUser={currentUser}
        />

        <WithdrawMilestoneFundsButton
          milestone={milestone}
          balance={balance}
          currentUser={currentUser}
        />

        <EditMilestoneButton milestone={milestone} balance={balance} currentUser={currentUser} />
      </Fragment>
    );
  }
}

MilestoneActions.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

MilestoneActions.defaultProps = {
  currentUser: undefined,
};

export default MilestoneActions;
