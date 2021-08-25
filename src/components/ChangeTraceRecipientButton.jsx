import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { Modal, Input } from 'antd';

import TraceService from 'services/TraceService';
import ErrorPopup from 'components/ErrorPopup';
import { authenticateUser, checkBalance } from 'lib/middleware';
import Trace from '../models/Trace';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { txNotification } from '../lib/helpers';

function ChangeTraceRecipientButton({ trace }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const newRecipient = useRef('');

  const setNewRecipient = input => {
    newRecipient.current = input.target.value;
  };

  const changeRecipient = () => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance)
        .then(async () => {
          try {
            const ifChangeRecipient = await new Promise(resolve =>
              Modal.confirm({
                title: `${trace.hasRecipient ? 'Change' : 'Set'} Trace Recipient?`,
                content: `Are you sure you want to ${
                  trace.hasRecipient ? 'change' : 'set'
                } the Trace
                    recipient? This action can not be undone.`,
                cancelText: 'Cancel',
                okText: 'Yes',
                centered: true,
                onOk: () => resolve(true),
                onCancel: () => resolve(false),
              }),
            );

            if (!ifChangeRecipient) return;

            const isNewRecipient = await new Promise(resolve =>
              Modal.confirm({
                title: `${trace.hasRecipient ? 'Change' : 'Set'} Trace Recipient?`,
                content: (
                  <Fragment>
                    <p>{`${trace.hasRecipient ? 'New recipient' : 'Recipient'} address:`}</p>
                    <Input onChange={setNewRecipient} className="rounded" />
                  </Fragment>
                ),
                cancelText: 'Cancel',
                okText: trace.hasRecipient ? 'Change recipient' : 'Set recipient',
                centered: true,
                onOk: () => resolve(true),
                onCancel: () => resolve(false),
              }),
            );

            if (!isNewRecipient) return;

            if (!utils.isAddress(newRecipient.current)) {
              // TODO create a modal & provide input validation before closing the alert
              Modal.error({
                title: 'Invalid Address',
                content: 'The provided address is invalid.',
                centered: true,
              });
              return;
            }
            if (
              // the bounties doesnt have recipient when creating, so we should first
              // check if trace has recipient check the address of it
              trace.recipient &&
              newRecipient.current.toLowerCase() === trace.recipient.address.toLowerCase()
            ) {
              Modal.error({
                title: 'Redundant Address',
                content:
                  'The new recipient address should be different from old recipient address.',
                centered: true,
              });
              return;
            }

            await TraceService.changeRecipient({
              trace,
              from: currentUser.address,
              newRecipient: newRecipient.current,
              onTxHash: txUrl =>
                txNotification(
                  `${trace.hasRecipient ? 'Changing ' : 'Setting '} Trace recipient is pending...`,
                  txUrl,
                  true,
                ),
              onConfirmation: txUrl => {
                txNotification(
                  `The Trace recipient has been ${trace.hasRecipient ? 'changed' : 'set'}!`,
                  txUrl,
                );
              },
              web3,
            });
          } catch (e) {
            console.error(e);
          }
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong while changing recipient.', err);
          }
        });
    });
  };

  return (
    <Fragment>
      {trace.canUserChangeRecipient(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() =>
            isForeignNetwork ? changeRecipient() : displayForeignNetRequiredWarning()
          }
        >
          {trace.hasRecipient ? 'Change Recipient' : 'Set Recipient'}
        </button>
      )}
    </Fragment>
  );
}

ChangeTraceRecipientButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(ChangeTraceRecipientButton);
