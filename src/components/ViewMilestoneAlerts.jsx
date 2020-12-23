import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import ProjectViewActionAlert from './projectViewActionAlert';
import AcceptRejectProposedMilestoneButtons from './AcceptRejectProposedMilestoneButtons';
import ReproposeRejectedMilestoneButton from './ReproposeRejectedMilestoneButton';
import ArchiveMilestoneButton from './ArchiveMilestoneButton';
import Milestone from '../models/Milestone';
import Campaign from '../models/Campaign';
import User from '../models/User';
import ChangeMilestoneRecipientButton from './ChangeMilestoneRecipientButton';
import ApproveRejectMilestoneCompletionButtons from './ApproveRejectMilestoneCompletionButtons';
import WithdrawMilestoneFundsButton from './WithdrawMilestoneFundsButton';
import DelegateMultipleButton from './DelegateMultipleButton';

export default function ViewMilestoneAlerts(props) {
  const { currentUser, balance, milestone, campaign } = props;
  const { fullyFunded, status } = milestone;
  const milestoneIsActive = status === 'InProgress' && !fullyFunded;

  return (
    <div>
      {currentUser && milestoneIsActive && (
        <ProjectViewActionAlert message="Delegate some donation to this project">
          <DelegateMultipleButton
            milestone={milestone}
            campaign={campaign}
            balance={balance}
            currentUser={currentUser}
          />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserAcceptRejectProposal(currentUser) && (
        <ProjectViewActionAlert message="Accept proposed milestone?">
          <AcceptRejectProposedMilestoneButtons
            balance={balance}
            milestone={milestone}
            currentUser={currentUser}
          />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserRepropose(currentUser) && (
        <ProjectViewActionAlert message="Propose milestone again?">
          <ReproposeRejectedMilestoneButton milestone={milestone} currentUser={currentUser} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserArchive(currentUser) && (
        <ProjectViewActionAlert message="Archive milestone">
          <ArchiveMilestoneButton
            milestone={milestone}
            currentUser={currentUser}
            balance={balance}
          />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserChangeRecipient(currentUser) && (
        <ProjectViewActionAlert message="Change recipient">
          <ChangeMilestoneRecipientButton
            milestone={milestone}
            currentUser={currentUser}
            balance={balance}
          />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserApproveRejectCompletion(currentUser) && (
        <ProjectViewActionAlert message="Do you think milestone goals are achieved?">
          <ApproveRejectMilestoneCompletionButtons
            milestone={milestone}
            currentUser={currentUser}
            balance={balance}
          />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserWithdraw(currentUser) && (
        <ProjectViewActionAlert message="Collect the funds held in this Milestone">
          <WithdrawMilestoneFundsButton
            milestone={milestone}
            currentUser={currentUser}
            balance={balance}
          />
        </ProjectViewActionAlert>
      )}
    </div>
  );
}

ViewMilestoneAlerts.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User),
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

ViewMilestoneAlerts.defaultProps = {
  currentUser: undefined,
};
