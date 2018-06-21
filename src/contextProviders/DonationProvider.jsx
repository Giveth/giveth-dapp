import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';

import { checkWalletBalance } from '../lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from '../components/ErrorPopup';
import getNetwork from '../lib/blockchain/getNetwork';

// Models
import Donation from '../models/Donation';
import User from '../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';

// Services
import DonationService from '../services/DonationService';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 * Donation provider listing given user's donation and actions on top of them
 *
 * @prop currentUser User for whom the list of donations should be retrieved
 * @prop wallet      Wallet object
 * @prop children    Child REACT components
 */
class DonationProvider extends Component {
  constructor() {
    super();

    this.state = {
      donations: [],
      isLoading: true,
      etherScanUrl: undefined,
    };

    this.refund = this.refund.bind(this);
    this.commit = this.commit.bind(this);
    this.reject = this.reject.bind(this);
  }

  componentWillMount() {
    getNetwork().then(network => this.setState({ etherScanUrl: network.etherscan }));

    // Get the donations for current user
    if (this.props.currentUser) {
      this.donationsObserver = feathersClient
        .service('donations')
        .watch({ listStrategy: 'always' })
        .find(
          paramsForServer({
            schema: 'includeTypeDetails',
            query: {
              giverAddress: this.props.currentUser.address,
              $limit: 100,
            },
          }),
        )
        .subscribe(
          resp => {
            this.setState({
              donations: resp.data.map(d => new Donation(d)),
              isLoading: false,
            });
          },
          e => {
            this.setState({
              isLoading: false,
            });
            ErrorPopup('Unable to retrieve donations from the server', e);
          },
        );
    }
  }

  componentWillUnmount() {
    // Clean up the observers
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
  }

  /**
   * Reject the delegation of the donation
   *
   * @param donation Donation which delegation should be rejected
   */
  reject(donation) {
    checkWalletBalance(this.props.wallet)
      .then(() =>
        React.swal({
          title: 'Reject your donation?',
          text:
            'Your donation will not go to this Milestone. You will still be in control of you funds and the DAC can still delegate you donation.',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, reject'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            // Inform user after the transaction is created
            const afterCreate = txLink => {
              React.toast.success(
                <p>
                  The refusal of the delegation is pending...<br />
                  <a href={txLink} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>,
              );
            };

            // Inform user after the refusal transaction is mined
            const afterMined = txLink => {
              React.toast.success(
                <p>
                  Your donation delegation has been rejected.<br />
                  <a href={txLink} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>,
              );
            };

            // Reject the delegation of the donation
            DonationService.reject(
              donation,
              this.props.currentUser.address,
              afterCreate,
              afterMined,
            );
          }
        }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  /**
   * Commit donation that has been delegated
   *
   * @param donation Donation to be committed
   */
  commit(donation) {
    checkWalletBalance(this.props.wallet)
      .then(() =>
        React.swal({
          title: 'Commit your donation?',
          text:
            'Your donation will go to this Milestone. After committing you can no longer take back your money.',
          icon: 'warning',
          buttons: ['Cancel', 'Yes, commit'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            // Inform user after the transaction is created
            const afterCreate = txLink => {
              React.toast.success(
                <p>
                  The commitment of the donation is pending...<br />
                  <a href={txLink} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>,
              );
            };

            // Inform user after the commit transaction is mined
            const afterMined = txLink => {
              React.toast.success(
                <p>
                  Your donation has been committed!<br />
                  <a href={txLink} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>,
              );
            };

            // Commit the donation's delegation
            DonationService.commit(
              donation,
              this.props.currentUser.address,
              afterCreate,
              afterMined,
            );
          }
        }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  /**
   * Refund a donation
   *
   * @param donation Donation to be refunded
   */
  refund(donation) {
    checkWalletBalance(this.props.wallet)
      .then(() =>
        React.swal({
          title: 'Refund your donation?',
          text:
            'Your donation will be cancelled and a payment will be authorized to refund your tokens. All withdrawals must be confirmed for security reasons and may take a day or two. Upon confirmation, your tokens will be transferred to your wallet.',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, refund'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            // Inform user after the transaction is created
            const afterCreate = txLink => {
              React.toast.success(
                <p>
                  The refund is pending...<br />
                  <a href={txLink} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>,
              );
            };

            // Inform user after the refund transaction is mined
            const afterMined = txLink => {
              React.toast.success(
                <p>
                  Your donation has been refunded!<br />
                  <a href={txLink} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>,
              );
            };

            // Refund the donation
            DonationService.refund(
              donation,
              this.props.currentUser.address,
              afterCreate,
              afterMined,
            );
          }
        }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { donations, isLoading, etherScanUrl } = this.state;
    const { refund, commit, reject } = this;

    return (
      <Provider
        value={{
          state: {
            donations,
            isLoading,
            etherScanUrl,
          },
          actions: {
            refund,
            commit,
            reject,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

DonationProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(GivethWallet),
};

DonationProvider.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default DonationProvider;
