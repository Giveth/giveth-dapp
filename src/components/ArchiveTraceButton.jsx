/* eslint-disable react/no-unescaped-entities */
import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';

import Trace from 'models/Trace';
import Campaign from 'models/Campaign';
import TraceService from 'services/TraceService';
import { authenticateUser, checkBalance } from 'lib/middleware';
import ErrorHandler from '../lib/ErrorHandler';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as NotificationContext } from '../contextProviders/NotificationModalProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

const ArchiveTraceButton = ({ trace, isAmountEnoughForWithdraw }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const {
    actions: { minPayoutWarningInArchive },
  } = useContext(NotificationContext);

  const archiveTrace = () => {
    const status = trace.donationCounters.some(dc => dc.currentBalance.gt(0))
      ? Trace.COMPLETED
      : Trace.PAID;

    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance)
        .then(async () => {
          if (!isAmountEnoughForWithdraw) {
            minPayoutWarningInArchive();
            return;
          }

          const proceed = await new Promise(resolve =>
            Modal.confirm({
              title: 'Archive Trace?',
              content: `Are you sure you want to archive this Trace? The trace status will be set to ${status} and will no longer be able to accept donations.`,
              cancelText: 'Cancel',
              okText: 'Archive',
              centered: true,
              onOk: () => resolve(true),
              onCancel: () => resolve(false),
            }),
          );

          if (!proceed) return;

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

          const onError = (_, err) => {
            if (err === 'patch-error') {
              ErrorHandler(err, 'Something went wrong with archiving this Trace');
            } else {
              ErrorHandler(err, 'Something went wrong with your transaction ...');
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
              web3,
            }).then();
          } else {
            const campaign = new Campaign(trace.campaign);
            campaign.archivedTraces.add(trace.projectId);
            campaign.save(afterSave, afterMined, web3).then();
          }
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorHandler(err, 'There is no balance left on the account.');
          } else if (err !== undefined) {
            ErrorHandler(err, 'Something went wrong while archiving.');
          }
        });
    });
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
