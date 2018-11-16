import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
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
React.minimumWalletBalanceInWei = utils.toBN(utils.toWei('0.01'));

React.whitelist = {};

// Fetch whitelist
feathersClient
  .service('/whitelist')
  .find()
  .then(whitelist => {
    React.whitelist = whitelist;
    console.log('React.whitelist', whitelist);
  });

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
  }

  componentDidMount() {
    this.getUserData(this.props.account);
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.state;
    const { account } = this.props;
    if ((account && !currentUser) || (currentUser && account !== prevProps.account)) {
      this.getUserData(account);
    }
    this.checkGivethWallet();
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
                this.authenticateIfPossible();
                resolve();
              });
            },
            error => {
              ErrorPopup(
                'Something went wrong with getting user profile. Please try again after refresh.',
                error,
              );
              this.setState({ currentUser: new User({ address }) }, () => {
                this.authenticateIfPossible();
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
          buttons: ['Ok', 'Download Keystore'],
        }).then(download => {
          if (download) {
            // GivethWallet.loadWallet(keystore);
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(
              new Blob([JSON.stringify(keystore[0])], {
                type: 'application/json',
              }),
            );
            downloadLink.download = `UTC--${new Date().toISOString()}-${keystore[0].address}.json`;

            downloadLink.click();
            GivethWallet.removeCachedKeystore();
          }
        });
      })
      .catch(() => {});
  }

  async authenticateIfPossible() {
    const { currentUser } = this.state;

    if (currentUser) {
      try {
        const token = await feathersClient.passport.getJWT();

        if (token) {
          const payload = await feathersClient.passport.verifyJWT(token);

          if (currentUser.address === payload.userId) {
            await feathersClient.authenticate(); // authenticate the socket connection
          } else {
            await feathersClient.logout();
          }
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
