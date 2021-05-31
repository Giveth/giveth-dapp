import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';

import TraceService from 'services/TraceService';
import ErrorPopup from 'components/ErrorPopup';
import { actionWithLoggedIn, checkBalance } from 'lib/middleware';
import Trace from '../models/Trace';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

function ChangeTraceRecipientButton({ trace }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const changeRecipient = () => {
    actionWithLoggedIn(currentUser).then(() => {
      checkBalance(balance)
        .then(async () => {
          try {
            // We want to retrieve MyInput as a pure DOM node:
            const newRecipient = await React.swal({
              title: 'Change Trace Recipient?',
              text: `Are you sure you want to ${
                trace.hasRecipient ? 'change' : 'set'
              } the Trace recipient? This action can not be undone.`,
              icon: 'warning',
              dangerMode: true,
              buttons: ['Cancel', 'Yes'],
              content: {
                element: 'input',
                attributes: {
                  placeholder: 'Set the recipient address ...',
                  type: 'text',
                },
              },
            });

            // if null, then "Cancel" was pressed
            if (newRecipient === null) return;

            if (!utils.isAddress(newRecipient)) {
              // TODO create a modal & provide input validation before closing the alert
              React.swal({
                title: 'Invalid Address',
                text: 'The provided address is invalid.',
                type: 'error',
                icon: 'error',
              });
              return;
            }

            await TraceService.changeRecipient({
              trace,
              from: currentUser.address,
              newRecipient,
              onTxHash: txUrl => {
                React.toast.info(
                  <p>
                    {trace.hasRecipient ? 'Changing ' : 'Setting '} Trace recipient is pending...
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onConfirmation: txUrl => {
                React.toast.success(
                  <p>
                    The Trace recipient has been {trace.hasRecipient ? 'changed' : 'set'}!
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onError: (err, txUrl) => {
                if (err === 'patch-error') {
                  if (!currentUser.authenticated) return;
                  ErrorPopup(
                    `Something went wrong ${
                      trace.hasRecipient ? 'changing ' : 'setting '
                    } the Trace recipient.`,
                    err,
                  );
                } else {
                  ErrorPopup(
                    'Something went wrong with the transaction.',
                    `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                  );
                }
              },
            });
          } catch (e) {
            console.error(e);
          }
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
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
