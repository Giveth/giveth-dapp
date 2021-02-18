import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';

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

function MilestoneActions({ milestone }) {
  return (
    <Fragment>
      <AcceptRejectProposedMilestoneButtons milestone={milestone} />

      <ReproposeRejectedMilestoneButton milestone={milestone} />

      {milestone.hasRecipient ? <RequestMarkMilestoneCompleteButton milestone={milestone} /> : null}

      <ArchiveMilestoneButton milestone={milestone} />

      <ChangeMilestoneRecipientButton milestone={milestone} />

      <CancelMilestoneButton milestone={milestone} />

      <DeleteProposedMilestoneButton milestone={milestone} />

      <ApproveRejectMilestoneCompletionButtons milestone={milestone} />

      <WithdrawMilestoneFundsButton milestone={milestone} />

      <EditMilestoneButton milestone={milestone} />
    </Fragment>
  );
}

MilestoneActions.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default MilestoneActions;
