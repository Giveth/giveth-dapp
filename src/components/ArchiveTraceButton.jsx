/* eslint-disable react/no-unescaped-entities */
import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import Trace from 'models/Trace';
import Campaign from 'models/Campaign';
import TraceService from 'services/TraceService';
import ErrorPopup from 'components/ErrorPopup';
import { actionWithLoggedIn, checkBalance } from 'lib/middleware';
import { message } from 'antd';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';

const ArchiveTraceButton = ({ trace, isAmountEnoughForWithdraw }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const {
    state: { minimumPayoutUsdValue },
  } = useContext(WhiteListContext);

  const archiveTrace = () => {
    const status = trace.donationCounters.some(dc => dc.currentBalance.gt(0))
      ? Trace.COMPLETED
      : Trace.PAID;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(async () => {
          if (!isAmountEnoughForWithdraw) {
            message.error(
              `Oh No!
        A minimum donation balance of ${minimumPayoutUsdValue} USD is required
        before you can archive this trace. This is a temporary
        limitation due to Ethereum Mainnet issues.`,
            );
            return;
          }
          const proceed = await React.swal({
            title: 'Archive Trace?',
            text: `Are you sure you want to archive this Trace? The trace status will be set to ${status} and will no longer be able to accept donations.`,
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Archive'],
          });

          // if null, then "Cancel" was pressed
          if (proceed === null) return;

          const afterSave = txUrl => {
            React.toast.info(
              <p>
                Archiving this Trace...
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          };

          const afterMined = txUrl => {
            React.toast.success(
              <p>
                The Trace has been archived!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          };

          const onError = (err, txUrl) => {
            if (err === 'patch-error') {
              ErrorPopup('Something went wrong archiving this Trace', err);
            } else {
              ErrorPopup(
                'Something went wrong with the transaction.',
                `${txUrl} => ${JSON.stringify(err, null, 2)}`,
              );
            }
          };

          const userAddress = currentUser.address;
          if (trace.ownerAddress === userAddress) {
            trace.status = Trace.ARCHIVED;
            trace.parentProjectId = trace.campaign.projectId;
            TraceService.save({
              trace,
              from: userAddress,
              afterSave,
              afterMined,
              onError,
            });
          } else {
            const campaign = new Campaign(trace.campaign);
            campaign.archivedTraces.add(trace.projectId);
            campaign.save(afterSave, afterMined);
          }
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        }),
    );
  };

  return (
    <Fragment>
      {trace.canUserArchive(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() => (isForeignNetwork ? archiveTrace() : displayForeignNetRequiredWarning())}
        >
          Archive
        </button>
      )}
    </Fragment>
  );
};

ArchiveTraceButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(ArchiveTraceButton);
