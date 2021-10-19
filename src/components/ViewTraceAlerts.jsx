import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ProjectViewActionAlert from './projectViewActionAlert';
import AcceptRejectProposedTraceButtons from './AcceptRejectProposedTraceButtons';
import ReproposeRejectedTraceButton from './ReproposeRejectedTraceButton';
import ArchiveTraceButton from './ArchiveTraceButton';
import Trace from '../models/Trace';
import Campaign from '../models/Campaign';
import ChangeTraceRecipientButton from './ChangeTraceRecipientButton';
import ApproveRejectTraceCompletionButtons from './ApproveRejectTraceCompletionButtons';
import WithdrawTraceFundsButton from './WithdrawTraceFundsButton';
import DelegateMultipleButton from './DelegateMultipleButton';
import { Context as UserContext } from '../contextProviders/UserProvider';
import RequestMarkTraceCompleteButton from './RequestMarkTraceCompleteButton';
import config from '../configuration';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

const ViewTraceAlerts = ({ trace, campaign, isAmountEnoughForWithdraw, withdrawalTokens }) => {
  const {
    state: { currentUser, userIsCommunityOwner },
  } = useContext(UserContext);
  const {
    state: { minimumPayoutUsdValue },
  } = useContext(WhiteListContext);

  const { fullyFunded, status } = trace;
  const traceIsActive = status === 'InProgress' && !fullyFunded;

  const userAddress = currentUser.address;
  const campaignOwnerAddress = campaign && campaign.ownerAddress;

  const userCanDelegate =
    userIsCommunityOwner || (userAddress && userAddress === campaignOwnerAddress);
  const traceIsDelegateable =
    userCanDelegate && traceIsActive && campaign.status !== Campaign.ARCHIVED;

  return (
    <div>
      {traceIsDelegateable && (
        <ProjectViewActionAlert message="Delegate some donation to this project">
          <DelegateMultipleButton trace={trace} campaign={campaign} />
        </ProjectViewActionAlert>
      )}

      {trace.canUserMarkComplete(currentUser) && (
        <ProjectViewActionAlert message="Mark this Trace as completed and ready for the Trace Reviewer to verify!">
          <RequestMarkTraceCompleteButton
            trace={trace}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
            minimumPayoutUsdValue={minimumPayoutUsdValue}
          />
        </ProjectViewActionAlert>
      )}

      {trace.canUserAcceptRejectProposal(currentUser) && (
        <ProjectViewActionAlert message="Accept proposed trace?">
          <AcceptRejectProposedTraceButtons trace={trace} />
        </ProjectViewActionAlert>
      )}

      {trace.canUserRepropose(currentUser) && (
        <ProjectViewActionAlert message="Propose trace again?">
          <ReproposeRejectedTraceButton trace={trace} />
        </ProjectViewActionAlert>
      )}

      {trace.canUserArchive(currentUser) && (
        <ProjectViewActionAlert message="Archive trace">
          <ArchiveTraceButton trace={trace} isAmountEnoughForWithdraw={isAmountEnoughForWithdraw} />
        </ProjectViewActionAlert>
      )}

      {trace.canUserChangeRecipient(currentUser) && (
        <ProjectViewActionAlert message="Change recipient">
          <ChangeTraceRecipientButton trace={trace} />
        </ProjectViewActionAlert>
      )}

      {trace.canUserApproveRejectCompletion(currentUser) && (
        <ProjectViewActionAlert message="Do you think trace goals are achieved?">
          <ApproveRejectTraceCompletionButtons trace={trace} />
        </ProjectViewActionAlert>
      )}

      {trace.canUserWithdraw(currentUser) && (
        <ProjectViewActionAlert
          message={`You use ${config.foreignNetworkName} to collect funds and we pay the fees to send it to you on ${config.homeNetworkName}`}
        >
          <WithdrawTraceFundsButton
            trace={trace}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
            withdrawalTokens={withdrawalTokens}
          />
        </ProjectViewActionAlert>
      )}
    </div>
  );
};

ViewTraceAlerts.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
  withdrawalTokens: PropTypes.arrayOf(PropTypes.shape({})),
};

ViewTraceAlerts.defaultProps = {
  withdrawalTokens: [],
};

export default React.memo(ViewTraceAlerts);
