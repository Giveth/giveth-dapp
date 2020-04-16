import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class ChangeMilestoneRecipientButton extends Component {
  changeRecipient() {
    const { milestone, balance, currentUser } = this.props;

    actionWithLoggedIn(currentUser).then(() => {
      checkBalance(balance)
        .then(async () => {
          try {
            // We want to retrieve MyInput as a pure DOM node:
            const newRecipient = await React.swal({
              title: 'Change Milestone Recipient?',
              text: `Are you sure you want to ${
                milestone.hasRecipient ? 'change' : 'set'
              } the Milestone recipient? This action can not be undone.`,
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

            await MilestoneService.changeRecipient({
              milestone,
              from: currentUser.address,
              newRecipient,
              onTxHash: txUrl => {
                React.toast.info(
                  <p>
                    {milestone.hasRecipient ? 'Changing ' : 'Setting '} Milestone recipient is
                    pending...
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
                    The Milestone recipient has been {milestone.hasRecipient ? 'changed' : 'set'}!
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
                      milestone.hasRecipient ? 'changing ' : 'setting '
                    } the Milestone recipient.`,
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
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork }, actions: { displayForeignNetRequiredWarning } }) => (
          <Fragment>
            {milestone.canUserChangeRecipient(currentUser) && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() =>
                  isForeignNetwork ? this.changeRecipient() : displayForeignNetRequiredWarning()
                }
              >
                {milestone.hasRecipient ? 'Change Recipient' : 'Set Recipient'}
              </button>
            )}
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

ChangeMilestoneRecipientButton.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

ChangeMilestoneRecipientButton.defaultProps = {
  currentUser: undefined,
};

export default ChangeMilestoneRecipientButton;
