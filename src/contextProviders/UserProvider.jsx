import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { feathersClient } from '../lib/feathersClient';

import GivethWallet from '../lib/blockchain/GivethWallet';
import getWeb3 from '../lib/blockchain/getWeb3';

import ErrorPopup from '../components/ErrorPopup';

// models
import User from '../models/User';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile
React.minimumWalletBalance = 0.02;

React.whitelist = {};

// Fetch whitelist
feathersClient
  .service('/whitelist')
  .find()
  .then(whitelist => {
    React.whitelist = whitelist;
  });

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 */
class UserProvider extends Component {
  static getUserProfile(address) {
    return feathersClient
      .service('/users')
      .get(address)
      .then(user => user)
      .catch(err => {
        ErrorPopup(
          'Something went wrong with getting user profile. Please try again after refresh.',
          err,
        );
      });
  }
  constructor() {
    super();

    this.state = {
      web3: undefined,
      currentUser: undefined,
      isLoading: true,
      hasError: false,
      wallet: undefined,
    };

    this.handleWalletChange = this.handleWalletChange.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.unlockWallet = this.unlockWallet.bind(this);

    // Making unlock wallet global
    React.unlockWallet = this.unlockWallet;
  }

  componentWillMount() {
    //  Load the wallet if it is cached
    feathersClient.passport
      .getJWT()
      .then(token => {
        if (token) return feathersClient.passport.verifyJWT(token);
        return null;
      })
      .then(payload => UserProvider.getUserProfile(payload.userId))
      .then(user => {
        if (!user) throw new Error('No User');
        feathersClient.authenticate(); // need to authenticate the socket connection

        this.setState({
          isLoading: false,
          hasError: false,
          currentUser: new User(user),
        });
      })
      .catch(() => {
        this.setState({ isLoading: false, hasError: false });
      });

    GivethWallet.getCachedKeystore()
      .then(keystore => {
        // TODO: change to getWeb3() when implemented. actually remove provider from GivethWallet
        const provider = this.state.web3 ? this.state.web3.currentProvider : undefined;
        return GivethWallet.loadWallet(keystore, provider);
      })
      .then(wallet => {
        getWeb3().then(web3 => web3.setWallet(wallet));
        this.setState({ wallet });
      })
      .catch(err => {
        if (err.message !== 'No keystore found') {
          ErrorPopup(
            'Something went wrong with getting the cached keystore. Please try again after refresh.',
            err,
          );
        }
      });
  }

  onSignOut() {
    if (this.state.wallet) this.state.wallet.lock();

    feathersClient.logout();
    this.setState({ currentUser: undefined });
  }

  onSignIn() {
    const address = this.state.wallet.getAddresses()[0];
    return UserProvider.getUserProfile(address).then(user =>
      this.setState({ currentUser: new User(user) }),
    );
  }

  handleWalletChange(wallet) {
    wallet.cacheKeystore();
    const address = wallet.getAddresses()[0];

    getWeb3().then(web3 => web3.setWallet(wallet));

    UserProvider.getUserProfile(address).then(user =>
      this.setState({
        wallet,
        currentUser: new User(user),
      }),
    );
  }

  unlockWallet(redirectAfter) {
    this.setState({ showUnlockWalletModal: true, redirectAfter });
  }

  walletUnlocked() {
    this.hideUnlockWalletModal();
    React.toast.success(
      <p>
        Your wallet has been unlocked.<br />
        Note that your wallet will <strong>auto-lock</strong> upon page refresh.
      </p>,
    );
  }

  hideUnlockWalletModal() {
    this.setState({ showUnlockWalletModal: false, redirectAfter: undefined });
  }

  render() {
    const {
      currentUser,
      wallet,
      web3,
      isLoading,
      hasError,
      showUnlockWalletModal,
      redirectAfter,
    } = this.state;

    const { onSignIn, onSignOut, walletUnlocked, hideUnlockWalletModal, handleWalletChange } = this;

    return (
      <Provider
        value={{
          state: {
            currentUser,
            wallet,
            web3,
            isLoading,
            hasError,
            showUnlockWalletModal,
            redirectAfter,
          },
          actions: {
            onSignIn,
            onSignOut,
            walletUnlocked,
            hideUnlockWalletModal,
            handleWalletChange,
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
};

export default UserProvider;
