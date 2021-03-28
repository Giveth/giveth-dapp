import React, { Fragment, useContext, useEffect, useState } from 'react';
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
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';

function MilestoneActions({ milestone }) {
  const {
    actions: { convertMultipleRates },
  } = useContext(ConversionRateContext);
  const {
    state: { minimumPayoutUsdValue },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const [currentBalanceUsdValue, setCurrentBalanceUsdValue] = useState(0);
  const [isAmountEnoughForWithdraw, setIsAmountEnoughForWithdraw] = useState(true);

  const calculateMilestoneCurrentBalanceUsdValue = async () => {
    try {
      const result = await convertMultipleRates(
        null,
        'USD',
        milestone.donationCounters.map(dc => {
          return {
            value: dc.currentBalance,
            currency: dc.symbol,
          };
        }),
      );
      setCurrentBalanceUsdValue(result.total);
    } catch (e) {
      // TODO should I remove this console.log?
      console.error('calculateMilestoneCurrentBalanceUsdValue error', e);
    }
  };

  useEffect(() => {
    setIsAmountEnoughForWithdraw(currentBalanceUsdValue > minimumPayoutUsdValue);
  }, [currentBalanceUsdValue]);

  useEffect(() => {
    // setLoading(true)

    if (
      !currentBalanceUsdValue &&
      currentUser.address &&
      milestone.donationCounters &&
      milestone.donationCounters.length
    ) {
      calculateMilestoneCurrentBalanceUsdValue();
    }
  });

  return (
    <Fragment>
      <AcceptRejectProposedMilestoneButtons milestone={milestone} />

      <ReproposeRejectedMilestoneButton milestone={milestone} />

      {milestone.hasRecipient ? (
        <RequestMarkMilestoneCompleteButton
          isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          minimumPayoutUsdValue={minimumPayoutUsdValue}
          milestone={milestone}
        />
      ) : null}

      <ArchiveMilestoneButton milestone={milestone} />

      <ChangeMilestoneRecipientButton milestone={milestone} />

      <CancelMilestoneButton milestone={milestone} />

      <DeleteProposedMilestoneButton milestone={milestone} />

      <ApproveRejectMilestoneCompletionButtons milestone={milestone} />

      <WithdrawMilestoneFundsButton
        milestone={milestone}
        isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
        minimumPayoutUsdValue={minimumPayoutUsdValue}
      />

      <EditMilestoneButton milestone={milestone} />
    </Fragment>
  );
}

MilestoneActions.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default MilestoneActions;
