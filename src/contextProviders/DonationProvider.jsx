import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { paramsForServer } from 'feathers-hooks-common';

import { authenticateIfPossible, checkBalance } from '../lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import confirmationDialog from '../lib/confirmationDialog';
import ErrorPopup from '../components/ErrorPopup';
import getNetwork from '../lib/blockchain/getNetwork';

// Models
import Donation from '../models/Donation';
import User from '../models/User';

// Services
import DonationService from '../services/DonationService';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 * Donation provider listing given user's donation and actions on top of them
 *
 * @prop currentUser User for whom the list of donations should be retrieved
 * @prop balance     User's balance
 * @prop children    Child REACT components
 */
class DonationProvider extends Component {
  constructor() {
    super();

    this.state = {
      donations: [],
      isLoading: true,
      etherScanUrl: undefined,
      visiblePages: 10,
      itemsPerPage: 50,
      skipPages: 0,
      totalResults: 0,
    };

    this.refund = this.refund.bind(this);
    this.commit = this.commit.bind(this);
    this.reject = this.reject.bind(this);
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.loadDonations = this.loadDonations.bind(this);
  }

  componentWillMount() {
    getNetwork().then(network => this.setState({ etherScanUrl: network.etherscan }));

    // Get the donations for current user
    if (this.props.currentUser) {
      authenticateIfPossible(this.props.currentUser).then(() => this.loadDonations());
    }
  }

  componentWillUnmount() {
    // Clean up the observers
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
  }

  // Function to fetch donations of the current user.
  loadDonations() {
    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(
        paramsForServer({
          schema: 'includeTypeDetails',
          query: {
            giverAddress: this.props.currentUser.address,
            amountRemaining: { $ne: 0 },
            $limit: this.state.itemsPerPage,
            $skip: this.state.skipPages * this.state.itemsPerPage,
            $sort: { createdAt: -1 },
          },
        }),
      )
      .subscribe(
        resp => {
          this.setState(prevState => ({
            donations: resp.data.map(d => new Donation(d)),
            skipPages: resp.skip / prevState.itemsPerPage,
            totalResults: resp.total,
            isLoading: false,
          }));
        },
        e => {
          this.setState({
            isLoading: false,
          });
          ErrorPopup('Unable to retrieve donations from the server', e);
        },
      );
  }

  /**
   * Reject the delegation of the donation
   *
   * @param donation Donation which delegation should be rejected
   */
  reject(donation) {
    checkBalance(this.props.balance)
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
                  The refusal of the delegation is pending...
                  <br />
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
                  Your donation delegation has been rejected.
                  <br />
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
    checkBalance(this.props.balance)
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
                  The commitment of the donation is pending...
                  <br />
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
                  Your donation has been committed!
                  <br />
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
              err => console.log('err', err),
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
    checkBalance(this.props.balance).then(() => {
      const confirmRefund = () => {
        const afterCreate = txLink => {
          React.toast.success(
            <p>
              The refund is pending...
              <br />
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
              Your donation has been refunded!
              <br />
              <a href={txLink} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        };

        // Refund the donation
        DonationService.refund(donation, this.props.currentUser.address, afterCreate, afterMined);
      };
      confirmationDialog('refund', donation.donatedTo.name, confirmRefund);
    });
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => this.loadDonations());
  }

  render() {
    const {
      donations,
      isLoading,
      etherScanUrl,
      itemsPerPage,
      visiblePages,
      totalResults,
      skipPages,
    } = this.state;
    const { refund, commit, reject, handlePageChanged } = this;

    return (
      <Provider
        value={{
          state: {
            donations,
            isLoading,
            etherScanUrl,
            itemsPerPage,
            visiblePages,
            totalResults,
            skipPages,
          },
          actions: {
            refund,
            commit,
            reject,
            handlePageChanged,
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
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

DonationProvider.defaultProps = {
  currentUser: undefined,
};

export default DonationProvider;
