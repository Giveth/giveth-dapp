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
    state: { payoutMinimumValue },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const [currentBalanceValue, setCurrentBalanceValue] = useState(0);
  const [isAmountEnoughForCollect, setIsAmountEnoughForCollect] = useState(true);

  const checkIsAmountEnoughForCollect = () => {
    const userNativeCurrency = currentUser.currency;
    if (
      payoutMinimumValue &&
      payoutMinimumValue[userNativeCurrency] &&
      currentBalanceValue < payoutMinimumValue[userNativeCurrency]
    ) {
      setIsAmountEnoughForCollect(false);
    } else {
      setIsAmountEnoughForCollect(true);
    }
  };

  const calculateMilestoneCurrentBalance = async () => {
    try {
      const result = await convertMultipleRates(
        null,
        currentUser.currency,
        milestone.donationCounters.map(dc => {
          return {
            value: dc.currentBalance,
            currency: dc.symbol,
          };
        }),
      );
      setCurrentBalanceValue(result.total);
    } catch (e) {
      // TODO should I remove this console.log?
      console.error('calculateMilestoneCurrentBalance error', e);
    }
  };

  useEffect(() => {
    checkIsAmountEnoughForCollect();
  }, [currentBalanceValue]);

  useEffect(() => {
    // setLoading(true)

    if (
      // not calculate again if we did before
      !currentBalanceValue &&
      currentUser.address &&
      currentUser.currency &&
      milestone.donationCounters &&
      milestone.donationCounters.length
    ) {
      calculateMilestoneCurrentBalance();
    }
  });

  return (
    <Fragment>
      <AcceptRejectProposedMilestoneButtons milestone={milestone} />

      <ReproposeRejectedMilestoneButton milestone={milestone} />

      {milestone.hasRecipient ? (
        <RequestMarkMilestoneCompleteButton
          isAmountEnoughForCollect={isAmountEnoughForCollect}
          payoutMinimumValue={payoutMinimumValue}
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
        isAmountEnoughForCollect={isAmountEnoughForCollect}
        payoutMinimumValue={payoutMinimumValue}
      />

      <EditMilestoneButton milestone={milestone} />
    </Fragment>
  );
}

MilestoneActions.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default MilestoneActions;
