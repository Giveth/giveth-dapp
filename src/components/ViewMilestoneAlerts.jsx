import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ProjectViewActionAlert from './projectViewActionAlert';
import AcceptRejectProposedMilestoneButtons from './AcceptRejectProposedMilestoneButtons';
import ReproposeRejectedMilestoneButton from './ReproposeRejectedMilestoneButton';
import ArchiveMilestoneButton from './ArchiveMilestoneButton';
import Milestone from '../models/Milestone';
import Campaign from '../models/Campaign';
import ChangeMilestoneRecipientButton from './ChangeMilestoneRecipientButton';
import ApproveRejectMilestoneCompletionButtons from './ApproveRejectMilestoneCompletionButtons';
import WithdrawMilestoneFundsButton from './WithdrawMilestoneFundsButton';
import DelegateMultipleButton from './DelegateMultipleButton';
import { Context as UserContext } from '../contextProviders/UserProvider';
import RequestMarkMilestoneCompleteButton from './RequestMarkMilestoneCompleteButton';

const ViewMilestoneAlerts = ({ milestone, campaign }) => {
  const {
    state: { currentUser, userIsDacOwner },
  } = useContext(UserContext);

  const { fullyFunded, status } = milestone;
  const milestoneIsActive = status === 'InProgress' && !fullyFunded;

  const userAddress = currentUser.address;
  const campaignOwnerAddress = campaign && campaign.ownerAddress;

  const userCanDelegate = userIsDacOwner || (userAddress && userAddress === campaignOwnerAddress);

  return (
    <div>
      {milestoneIsActive && userCanDelegate && (
        <ProjectViewActionAlert message="Delegate some donation to this project">
          <DelegateMultipleButton milestone={milestone} campaign={campaign} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserMarkComplete(currentUser) && (
        <ProjectViewActionAlert message="Request mark complete">
          <RequestMarkMilestoneCompleteButton milestone={milestone} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserAcceptRejectProposal(currentUser) && (
        <ProjectViewActionAlert message="Accept proposed milestone?">
          <AcceptRejectProposedMilestoneButtons milestone={milestone} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserRepropose(currentUser) && (
        <ProjectViewActionAlert message="Propose milestone again?">
          <ReproposeRejectedMilestoneButton milestone={milestone} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserArchive(currentUser) && (
        <ProjectViewActionAlert message="Archive milestone">
          <ArchiveMilestoneButton milestone={milestone} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserChangeRecipient(currentUser) && (
        <ProjectViewActionAlert message="Change recipient">
          <ChangeMilestoneRecipientButton milestone={milestone} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserApproveRejectCompletion(currentUser) && (
        <ProjectViewActionAlert message="Do you think milestone goals are achieved?">
          <ApproveRejectMilestoneCompletionButtons milestone={milestone} />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserWithdraw(currentUser) && (
        <ProjectViewActionAlert message="Collect the funds held in this Milestone">
          <WithdrawMilestoneFundsButton milestone={milestone} />
        </ProjectViewActionAlert>
      )}
    </div>
  );
};

ViewMilestoneAlerts.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  campaign: PropTypes.instanceOf(Campaign).isRequired,
};

export default React.memo(ViewMilestoneAlerts);
