import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import GA from 'lib/GoogleAnalytics';
import { checkBalance } from 'lib/middleware';

class WithdrawMilestoneFundsButton extends Component {
  withdraw() {
    const { milestone, currentUser, balance } = this.props;

    checkBalance(balance)
      .then(() => {
        React.swal({
          title: 'Withdrawal Funds to Wallet',
          content: React.swal.msg(
            <div>
              <p>We will initiate the transfer of the funds to your wallet.</p>
              <div className="alert alert-warning">
                Note: For security reasons, there is a delay of approximately 48 hrs before the
                funds will appear in your wallet.
              </div>
            </div>,
          ),
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, withdrawal'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            MilestoneService.withdraw({
              milestone,
              from: currentUser.address,
              onTxHash: txUrl => {
                GA.trackEvent({
                  category: 'Milestone',
                  action: 'initiated withdrawal',
                  label: milestone._id,
                });

                React.toast.info(
                  <p>
                    Initiating withdrawal from milestone...
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onConfirmation: txUrl => {
                React.toast.info(
                  <p>
                    The milestone withdraw has been initiated...
                    <br />
                    <a href={txUrl} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              },
              onError: (err, txUrl) => {
                let msg;

                if (err === 'patch-error') {
                  ErrorPopup('Something went wrong with witdrawing your funds', err);
                } else if (err.message === 'no-donations') {
                  msg = <p>Nothing to withdraw. There are no donations to this milestone.</p>;
                } else if (txUrl) {
                  // TODO: need to update feathers to reset the donations to previous state as this
                  // tx failed.
                  msg = (
                    <p>
                      Something went wrong with the transaction.
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>
                  );
                } else {
                  msg = <p>Something went wrong with the transaction.</p>;
                }

                React.swal({
                  title: 'Oh no!',
                  content: React.swal.msg(msg),
                  icon: 'error',
                });
              },
            });
          }
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { milestone, currentUser, isForeignNetwork } = this.props;

    return (
      <Fragment>
        {[milestone.recipientAddress, milestone.owner.address].includes(currentUser.address) &&
          milestone.status === Milestone.COMPLETED &&
          isForeignNetwork &&
          milestone.mined &&
          milestone.currentBalance.gt('0') > 0 && (
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => this.withdraw()}
            >
              <i className="fa fa-usd" />{' '}
              {milestone.recipientAddress === currentUser.address ? 'Collect' : 'Disburse'}
            </button>
          )}
      </Fragment>
    );
  }
}

WithdrawMilestoneFundsButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.objectOf(BigNumber).isRequired,
  milestone: PropTypes.objectOf(Milestone).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
};

export default WithdrawMilestoneFundsButton;
