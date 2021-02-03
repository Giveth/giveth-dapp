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
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import RequestMarkMilestoneCompleteButton from './RequestMarkMilestoneCompleteButton';

const ViewMilestoneAlerts = props => {
  const { milestone, campaign } = props;
  const { fullyFunded, status } = milestone;
  const {
    state: { currentUser, isDelegator },
  } = useContext(UserContext);
  const {
    state: { balance },
  } = useContext(Web3Context);

  const milestoneIsActive = status === 'InProgress' && !fullyFunded;

  const userAddress = currentUser && currentUser.address;
  const campaignOwnerAddress = campaign && campaign.ownerAddress;

  const userCanDelegate = isDelegator || (userAddress && userAddress === campaignOwnerAddress);

  return (
    <div>
      {milestoneIsActive && userCanDelegate && (
        <ProjectViewActionAlert message="Delegate some donation to this project">
          <DelegateMultipleButton
            milestone={milestone}
            campaign={campaign}
            balance={balance}
            currentUser={currentUser}
          />
        </ProjectViewActionAlert>
      )}

      {milestone.canUserMarkComplete(currentUser) && (
        <ProjectViewActionAlert message="Request mark complete">
          <RequestMarkMilestoneCompleteButton
            balance={balance}
            milestone={milestone}
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
};

ViewMilestoneAlerts.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  campaign: PropTypes.instanceOf(Campaign).isRequired,
};

export default ViewMilestoneAlerts;
