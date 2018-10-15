import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { feathersClient } from '../lib/feathersClient';

import GivethWallet from '../lib/blockchain/GivethWallet';
import { getWeb3, getHomeWeb3 } from '../lib/blockchain/getWeb3';

import ErrorPopup from '../components/ErrorPopup';
import { history } from '../lib/helpers';

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
      showUnlockWalletModal: false,
      showReviewerModal: false,
    };

    this.handleWalletChange = this.handleWalletChange.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.unlockWallet = this.unlockWallet.bind(this);
    this.changeReviewer = this.changeReviewer.bind(this);
    this.lockWallet = this.lockWallet.bind(this);
    this.walletUnlocked = this.walletUnlocked.bind(this);
    this.hideUnlockWalletModal = this.hideUnlockWalletModal.bind(this);
    this.hideChangeReviewer = this.hideChangeReviewer.bind(this);
    this.getUserData = this.getUserData.bind(this);

    // Making unlock wallet global
    React.unlockWallet = this.unlockWallet;
    React.changeReviewer = this.changeReviewer;
  }

  componentWillMount() {
    //  Load the wallet if it is cached
    feathersClient.passport
      .getJWT()
      .then(token => {
        if (token) return feathersClient.passport.verifyJWT(token);
        return null;
      })
      .then(payload => this.getUserData(payload.userId))
      .then(() => feathersClient.authenticate()) // need to authenticate the socket connection
      .then(() =>
        this.setState({
          isLoading: false,
          hasError: false,
        }),
      )
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
    history.push('/');
    if (this.state.wallet) this.state.wallet.lock();

    feathersClient.logout();
    this.setState({ currentUser: undefined, walletLocked: true });
  }

  onSignIn() {
    const address = this.state.wallet.getAddresses()[0];

    this.setState({ isLoading: true }, () =>
      this.getUserData(address).then(() =>
        this.setState({
          walletLocked: false,
          isLoading: false,
        }),
      ),
    );
  }

  getUserData(address) {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();

    return new Promise((resolve, reject) => {
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
            if (resp.total === 1) this.setState({ currentUser: new User(resp.data[0]) }, resolve());
            else reject();
          },
          error => {
            ErrorPopup(
              'Something went wrong with getting user profile. Please try again after refresh.',
              error,
            );
            reject();
          },
        );
    });
  }

  /**
   * Changes the wallet that is used by the user
   *
   * @param {GivethWallet} wallet       New user wallet to be set
   * @param {String}       redirectUrl  (optional) URL to which the user should be redirected
   */
  handleWalletChange(wallet, redirectUrl = false) {
    wallet.cacheKeystore();
    const address = wallet.getAddresses()[0];

    getWeb3().then(web3 => web3.setWallet(wallet));
    getHomeWeb3().then(homeWeb3 => homeWeb3.setWallet(wallet));

    this.setState({ isLoading: true }, async () => {
      await this.getUserData(address);

      this.setState({ wallet, walletLocked: false, isLoading: false }, () => {
        if (redirectUrl) history.push(redirectUrl);
      });
    });
  }

  unlockWallet(actionAfter) {
    this.setState({ showUnlockWalletModal: true, actionAfter });
  }

  changeReviewer(actionAfter) {
    this.setState({ showReviewerModal: true, actionAfter });
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
        Your wallet has been unlocked.
        <br />
        Note that your wallet will <strong>auto-lock</strong> upon page refresh.
      </p>,
    );
    this.setState({ walletLocked: false });
  }

  reviewFinished() {
    this.hideChangeReviewer();
    React.toast.success(<p>New Reviewer has been notified.</p>);
  }

  hideUnlockWalletModal() {
    this.setState({ showUnlockWalletModal: false, actionAfter: undefined });
  }

  hideChangeReviewer() {
    this.setState({ showReviewerModal: false, actionAfter: undefined });
  }

  render() {
    const {
      currentUser,
      wallet,
      web3,
      isLoading,
      hasError,
      showUnlockWalletModal,
      showReviewerModal,
      actionAfter,
      walletLocked,
    } = this.state;

    const {
      onSignIn,
      onSignOut,
      walletUnlocked,
      hideUnlockWalletModal,
      hideChangeReviewer,
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
            showReviewerModal,
            actionAfter,
            walletLocked,
          },
          actions: {
            onSignIn,
            onSignOut,
            walletUnlocked,
            lockWallet,
            hideUnlockWalletModal,
            hideChangeReviewer,
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
