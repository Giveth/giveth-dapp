import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { feathersClient } from '../lib/feathersClient';

import GivethWallet from '../lib/blockchain/GivethWallet';
import { getWeb3, getHomeWeb3 } from '../lib/blockchain/getWeb3';

import ErrorPopup from '../components/ErrorPopup';

// models
import User from '../models/User';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile
React.minimumWalletBalance = 0.01;

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
  constructor() {
    super();

    this.state = {
      web3: undefined,
      currentUser: undefined,
      isLoading: true,
      hasError: false,
      wallet: undefined,
      walletLocked: true,
    };

    this.handleWalletChange = this.handleWalletChange.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.unlockWallet = this.unlockWallet.bind(this);
    this.lockWallet = this.lockWallet.bind(this);
    this.walletUnlocked = this.walletUnlocked.bind(this);
    this.hideUnlockWalletModal = this.hideUnlockWalletModal.bind(this);
    this.getUserData = this.getUserData.bind(this);

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
      .then(payload => {
        this.getUserData(payload.userId);
        feathersClient.authenticate(); // need to authenticate the socket connection

        this.setState({
          isLoading: false,
          hasError: false,
        });
      })
      .catch(() => {
        this.setState({ isLoading: false, hasError: false });
      });

    GivethWallet.getCachedKeystore()
      .then(keystore => GivethWallet.loadWallet(keystore))
      .then(wallet => {
        getWeb3().then(web3 => web3.setWallet(wallet));
        getHomeWeb3().then(homeWeb3 => homeWeb3.setWallet(wallet));
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

  componentWillUnmount() {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();
  }

  onSignOut() {
    if (this.state.wallet) this.state.wallet.lock();

    feathersClient.logout();
    this.setState({ currentUser: undefined, walletLocked: true });
  }

  onSignIn() {
    const address = this.state.wallet.getAddresses()[0];
    this.getUserData(address);
    this.setState({ walletLocked: false });
  }

  getUserData(address) {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();
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
          if (resp.total === 1) this.setState({ currentUser: new User(resp.data[0]) });
        },
        error =>
          ErrorPopup(
            'Something went wrong with getting user profile. Please try again after refresh.',
            error,
          ),
      );
  }

  handleWalletChange(wallet) {
    wallet.cacheKeystore();
    const address = wallet.getAddresses()[0];

    getWeb3().then(web3 => web3.setWallet(wallet));
    getHomeWeb3().then(homeWeb3 => homeWeb3.setWallet(wallet));

    this.getUserData(address);
    this.setState({ wallet, walletLocked: false });
  }

  unlockWallet(redirectAfter) {
    this.setState({ showUnlockWalletModal: true, redirectAfter });
  }

  lockWallet() {
    React.swal({
      title: 'Lock your wallet?',
      text: 'You will be redirected to the home page. Any changes you have made will be lost.',
      icon: 'warning',
      dangerMode: true,
      buttons: ['Cancel', 'Yes, lock wallet!'],
    }).then(isConfirmed => {
      if (isConfirmed) {
        this.state.wallet.lock();
        this.setState({ walletLocked: true });
      }
    });
  }

  walletUnlocked() {
    this.hideUnlockWalletModal();
    React.toast.success(
      <p>
        Your wallet has been unlocked.<br />
        Note that your wallet will <strong>auto-lock</strong> upon page refresh.
      </p>,
    );
    this.setState({ walletLocked: false });
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
      walletLocked,
    } = this.state;

    const {
      onSignIn,
      onSignOut,
      walletUnlocked,
      hideUnlockWalletModal,
      handleWalletChange,
      lockWallet,
    } = this;

    return (
      <Provider
        value={{
          state: {
            currentUser,
            wallet,
            web3, // TODO do we need this here?
            isLoading,
            hasError,
            showUnlockWalletModal,
            redirectAfter,
            walletLocked,
          },
          actions: {
            onSignIn,
            onSignOut,
            walletUnlocked,
            lockWallet,
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
