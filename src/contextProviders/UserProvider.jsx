import React, { Component, createContext } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { authenticateIfPossible } from 'lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import GivethWallet from '../lib/blockchain/GivethWallet';

import ErrorPopup from '../components/ErrorPopup';

// models
import User from '../models/User';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile
React.minimumWalletBalance = 0.01;
React.minimumWalletBalanceInWei = new BigNumber(utils.toWei('0.01'));

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 */
class UserProvider extends Component {
  constructor() {
    super();

    this.state = {
      currentUser: undefined,
      hasError: false,
    };

    this.getUserData = this.getUserData.bind(this);
    this.authenticateFeathers = this.authenticateFeathers.bind(this);
    this.signIn = this.signIn.bind(this);

    // hack to make signIn globally available
    React.signIn = this.signIn;
  }

  componentDidMount() {
    this.getUserData(this.props.account);
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.state;

    const { account } = this.props;
    if ((account && !currentUser) || (currentUser && account !== prevProps.account)) {
      this.getUserData(account);
      this.checkGivethWallet();
    }
  }

  componentWillUnmount() {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();
  }

  async getUserData(address) {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();

    return new Promise((resolve, reject) => {
      if (!address) {
        this.setState({ currentUser: undefined }, () => {
          resolve();
          this.props.onLoaded();
        });
      } else {
        this.userSubscriber = feathersClient
          .service('/users')
          .watch({ listStrategy: 'always' })
          .find({
            query: {
              address,
            },
          })
          .subscribe(
            resp => {
              const currentUser = resp.total === 1 ? new User(resp.data[0]) : new User({ address });
              this.setState({ currentUser }, () => {
                this.authenticateFeathers();
                resolve();
              });
            },
            error => {
              ErrorPopup(
                'Something went wrong with getting user profile. Please try again after refresh.',
                error,
              );
              this.setState({ currentUser: new User({ address }) }, () => {
                this.authenticateFeathers();
                reject();
              });
            },
          );
      }
    });
  }

  // TODO: this can be removed after a sufficient time has passed w/ new Web3 support
  // eslint-disable-next-line class-methods-use-this
  checkGivethWallet() {
    GivethWallet.getCachedKeystore()
      .then(keystore => {
        React.swal({
          title: 'Giveth Wallet Deprecation Notice',
          text:
            'We noticed you have a Giveth wallet. We have replaced the Giveth wallet with support for MetaMask. You can import your keystore file directly into MetaMask to continue to using your Giveth wallet.',
          icon: 'warning',
          buttons: ['Remind me later', 'Download Keystore'],
        }).then(download => {
          if (download) {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(
              new Blob([JSON.stringify(keystore[0])], {
                type: 'application/json',
              }),
            );
            downloadLink.download = `UTC--${new Date().toISOString()}-${keystore[0].address}.json`;

            downloadLink.click();

            React.swal({
              title: 'Giveth Wallet Deprecation Notice',
              text:
                'Please confirm the wallet has been downloaded correctly and you can import it in MetaMask. We strongly advice to save this file in a secure location. Can we erase the original file?',
              icon: 'warning',
              buttons: ['Not Yet', 'Yes erase'],
            }).then(isConfirmed => {
              if (isConfirmed) GivethWallet.removeCachedKeystore();
            });
          }
        });
      })
      .catch(() => {});
  }

  signIn(redirectOnFail) {
    const { currentUser } = this.state;

    if (currentUser) {
      authenticateIfPossible(currentUser, redirectOnFail).then(isAuthenticated => {
        if (isAuthenticated) {
          currentUser.authenticated = true;
          this.setState({ currentUser: new User(currentUser) });
          this.props.onLoaded();
        }
      });
    }
  }

  async authenticateFeathers() {
    const { currentUser } = this.state;

    if (currentUser) {
      try {
        const token = await feathersClient.passport.getJWT();

        if (token) {
          const payload = await feathersClient.passport.verifyJWT(token);

          if (currentUser.address === payload.userId) {
            await feathersClient.authenticate(); // authenticate the socket connection
            currentUser.authenticated = true;
            this.setState({ currentUser });
          } else {
            await feathersClient.logout();
          }
        } else {
          currentUser.authenticated = false;
          this.setState({ currentUser });
        }
      } catch (e) {
        // ignore
      }
    }

    this.props.onLoaded();
  }

  render() {
    const { currentUser, hasError } = this.state;

    return (
      <Provider
        value={{
          state: {
            currentUser,
            hasError,
            signIn: this.signIn,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

UserProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  account: PropTypes.string,
  onLoaded: PropTypes.func,
};

UserProvider.defaultProps = {
  onLoaded: () => {},
  account: undefined,
};

export default UserProvider;
