import React, { Fragment, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import DeleteProposedTraceButton from 'components/DeleteProposedTraceButton';
import AcceptRejectProposedTraceButtons from 'components/AcceptRejectProposedTraceButtons';
import ArchiveTraceButton from 'components/ArchiveTraceButton';
import ReproposeRejectedTraceButton from 'components/ReproposeRejectedTraceButton';
import RequestMarkTraceCompleteButton from 'components/RequestMarkTraceCompleteButton';
import CancelTraceButton from 'components/CancelTraceButton';
import ApproveRejectTraceCompletionButtons from 'components/ApproveRejectTraceCompletionButtons';
import WithdrawTraceFundsButton from 'components/WithdrawTraceFundsButton';
import EditTraceButton from 'components/EditTraceButton';
import Trace from '../models/Trace';
import ChangeTraceRecipientButton from './ChangeTraceRecipientButton';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

function TraceActions({ trace }) {
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

  const calculateTraceCurrentBalanceUsdValue = async () => {
    try {
      const result = await convertMultipleRates(
        null,
        'USD',
        trace.donationCounters.map(dc => {
          return {
            value: dc.currentBalance,
            currency: dc.symbol,
          };
        }),
      );
      setCurrentBalanceUsdValue(result.usdValues);
    } catch (e) {
      // TODO should I remove this console.log?
      console.error('calculateTraceCurrentBalanceUsdValue error', e);
    }
  };

  useEffect(() => {
    if (!currentBalanceUsdValue) {
      return;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const currencyUsdValue of currentBalanceUsdValue) {
      // if usdValue is zero we should not set setIsAmountEnoughForWithdraw(false) because we check
      // minimumPayoutUsdValue comparison when usdValue for a currency is not zero
      if (currencyUsdValue.usdValue && currencyUsdValue.usdValue < minimumPayoutUsdValue) {
        setIsAmountEnoughForWithdraw(false);
        return;
      }
    }
    setIsAmountEnoughForWithdraw(true);
  }, [currentBalanceUsdValue]);

  useEffect(() => {
    // setLoading(true)

    if (
      !currentBalanceUsdValue &&
      currentUser.address &&
      trace.donationCounters &&
      trace.donationCounters.length
    ) {
      calculateTraceCurrentBalanceUsdValue();
    }
  }, [trace]);

  return (
    <Fragment>
      <AcceptRejectProposedTraceButtons trace={trace} />

      <ReproposeRejectedTraceButton trace={trace} />

      {trace.hasRecipient ? (
        <RequestMarkTraceCompleteButton
          isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          minimumPayoutUsdValue={minimumPayoutUsdValue}
          trace={trace}
        />
      ) : null}

      <ArchiveTraceButton trace={trace} isAmountEnoughForWithdraw={isAmountEnoughForWithdraw} />

      <ChangeTraceRecipientButton trace={trace} />

      <CancelTraceButton trace={trace} />

      <DeleteProposedTraceButton trace={trace} />

      <ApproveRejectTraceCompletionButtons trace={trace} />

      <WithdrawTraceFundsButton
        trace={trace}
        isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
      />

      <EditTraceButton trace={trace} />
    </Fragment>
  );
}

TraceActions.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default TraceActions;
