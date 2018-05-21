import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';

import { takeActionAfterWalletUnlock, checkWalletBalance } from '../lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from '../components/ErrorPopup';

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
    };

    this.refund = this.refund.bind(this);
  }

  componentWillMount() {
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
   * Refund a donation
   *
   * @param donation Donation to be refunded
   */
  refund(donation) {
    takeActionAfterWalletUnlock(this.props.wallet, () =>
      checkWalletBalance(this.props.wallet).then(() =>
        React.swal({
          title: 'Refund your donation?',
          text:
            'Your donation will be cancelled and a payment will be authorized to refund your tokens. All withdrawals must be confirmed for security reasons and may take a day or two. Upon confirmation, your tokens will be transferred to your wallet.',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, refund'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            donation.isRefunding = true;

            // Inform user after the transaction is created
            const afterCreate = txLink => {
              donation.isRefunding = false;
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
      ),
    );
  }

  render() {
    const { donations, isLoading } = this.state;
    const { refund } = this;

    return (
      <Provider
        value={{
          state: {
            donations,
            isLoading,
          },
          actions: {
            refund,
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
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default DonationProvider;
