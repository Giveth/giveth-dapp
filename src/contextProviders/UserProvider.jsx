// eslint-disable-next-line camelcase
import jwt_decode from 'jwt-decode';
import React, { Component, createContext } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { authenticateUser } from 'lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import GivethWallet from '../lib/blockchain/GivethWallet';
import ErrorHandler from '../lib/ErrorHandler';

// models
import User from '../models/User';
import { DACService } from '../services';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Context, Consumer };

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
      currentUser: {},
      hasError: false,
      userIsDacOwner: false,
      isLoading: true,
    };

    this.getUserData = this.getUserData.bind(this);
    this.authenticateFeathers = this.authenticateFeathers.bind(this);
    this.signIn = this.signIn.bind(this);
    this.updateUserData = this.updateUserData.bind(this);

    // hack to make signIn globally available
    React.signIn = this.signIn;
  }

  componentDidMount() {
    this.getUserData(this.props.account);
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.state;

    const { account } = this.props;
    if (
      (account && !currentUser.address) ||
      (currentUser.address && account !== prevProps.account)
    ) {
      this.getUserData(account);
      this.checkGivethWallet();
    }
  }

  async getUserData(address) {
    if (!address) {
      this.setState({ currentUser: {}, userIsDacOwner: false, isLoading: false }, () => {
        this.props.onLoaded();
      });
    } else {
      feathersClient
        .service('/users')
        .find({
          query: {
            address,
          },
        })
        .then(
          resp => {
            const currentUser = resp.total === 1 ? new User(resp.data[0]) : new User({ address });
            if (currentUser.address === address) {
              this.setState({ currentUser }, () => {
                this.authenticateFeathers();

                DACService.getUserIsDacOwner(
                  address,
                  userIsDacOwner => this.setState({ userIsDacOwner }),
                  () => this.setState({ userIsDacOwner: false }),
                );
              });
            }
          },
          error => {
            const message = `Something went wrong with getting user profile. Please try again after refresh.`;
            ErrorHandler(error, message);

            this.setState({ currentUser: new User({ address }) }, () => {
              this.authenticateFeathers();
            });
          },
        );
    }
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

    if (currentUser.address) {
      authenticateUser(currentUser, redirectOnFail).then(isAuthenticated => {
        if (isAuthenticated) {
          currentUser.authenticated = true;
          this.setState({
            currentUser: new User(currentUser),
            isLoading: false,
          });
          this.props.onLoaded();
        }
      });
    }
  }

  async authenticateFeathers() {
    const { currentUser } = this.state;

    if (currentUser.address) {
      try {
        const token = await feathersClient.authentication.getAccessToken();
        if (token) {
          const payload = jwt_decode(token);
          if (currentUser.address === payload.userId) {
            await feathersClient.reAuthenticate(); // authenticate the socket connection
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

    this.setState({ isLoading: false });
    this.props.onLoaded();
  }

  async updateUserData() {
    const { currentUser } = this.state;

    if (currentUser.address) {
      await this.getUserData(currentUser.address);
    }
  }

  render() {
    const { currentUser, hasError, userIsDacOwner, isLoading } = this.state;

    return (
      <Provider
        value={{
          state: {
            currentUser,
            hasError,
            signIn: this.signIn,
            userIsDacOwner,
            isLoading,
          },
          actions: {
            updateUserData: this.updateUserData,
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
