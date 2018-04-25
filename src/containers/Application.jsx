import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Web3 from 'web3';

import { Router, Route, Switch } from 'react-router-dom';
import localforage from 'localforage';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import Sweetalert from 'sweetalert';

import { feathersClient } from '../lib/feathersClient';

import DataRoutes from './DataRoutes';

import BaseWallet from '../lib/blockchain/BaseWallet';
import GivethWallet from '../lib/blockchain/GivethWallet';
import getWeb3 from '../lib/blockchain/getWeb3';
import { history } from '../lib/helpers';

// views
import Profile from './../components/views/Profile';
import UserWallet from './../components/views/UserWallet';
import EditProfile from './../components/views/EditProfile';
import SignIn from './../components/views/SignIn';
import Signup from './../components/views/SignUp';
import ChangeAccount from './../components/views/ChangeAccount';

import ViewMilestone from './../components/views/ViewMilestone';
import EditDAC from './../components/views/EditDAC';
import ViewDAC from './../components/views/ViewDAC';
import Donations from './../components/views/Donations';
import Delegations from './../components/views/Delegations';
import MyDACs from './../components/views/MyDACs';
import MyCampaigns from './../components/views/MyCampaigns';
import MyMilestones from './../components/views/MyMilestones';
import NotFound from './../components/views/NotFound';

import EditCampaign from './../components/views/EditCampaign';
import ViewCampaign from './../components/views/ViewCampaign';
import EditMilestone from './../components/views/EditMilestone';

// components
import MainMenu from './../components/MainMenu';
import Loader from './../components/Loader';
import UnlockWallet from '../components/UnlockWallet';

// models
import User from '../models/User';

import './../lib/validators';

import Accounts from 'web3-eth-accounts';

/* global document, window, alert */
/**
 * Here we hack to make stuff globally available
 */
// Make sweet alert global
React.swal = Sweetalert;

// Construct a dom node to be used as content for sweet alert
React.swal.msg = reactNode => {
  const wrapper = document.createElement('span');
  ReactDOM.render(reactNode, wrapper);
  return wrapper.firstChild;
};

// make toast globally available
React.toast = toast;

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile
React.minimumWalletBalance = 0.02;

React.whitelist = {};

// Fetch whitelist
feathersClient
  .service('/whitelist')
  .find()
  .then(whitelist => {
    console.log(whitelist);
    React.whitelist = whitelist;
  });

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 */
class Application extends Component {
  static getUserProfile(address) {
    return feathersClient
      .service('/users')
      .get(address)
      .then(user => user)
      .catch(err => {
        console.error(err); // eslint-disable-line no-console
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

    localforage.config({
      name: 'giveth',
    });

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
      .then(payload => Application.getUserProfile(payload.userId))
      .then(user => {
        if (!user) throw new Error('No User');
        feathersClient.authenticate(); // need to authenticate the socket connection

        this.setState({
          isLoading: false,
          hasError: false,
          currentUser: new User(user),
        });
      })
      .catch(e => {
        console.error(e); // eslint-disable-line no-console
        this.authMetaMask();
        this.setState({ isLoading: false, hasError: false });
      });

      const { web3 } = window;

      // check if web3 has been injected into dom window
      if (typeof web3 !== 'undefined') {
        const web3js = new Web3(web3.currentProvider);
  
        web3js.eth.getAccounts((err, acc) => {
          const wallet = new BaseWallet(acc[0], web3js);
  
          // add wallet to application state
          getWeb3().then(web3 => web3.setWallet(wallet));
          this.setState({ wallet });
        })
    } else {
      // if not web3 is not injected, use same Giveth wallet as before
      GivethWallet.getCachedKeystore()
        .then(keystore => {
          // TODO change to getWeb3() when implemented. actually remove provider from GivethWallet
          const provider = this.state.web3 ? this.state.web3.currentProvider : undefined;
          return GivethWallet.loadWallet(keystore, provider);
        })
        .then(wallet => {
          getWeb3().then(web3 => web3.setWallet(wallet));
          this.setState({ wallet });
        })
        .catch(err => {
          if (err.message !== 'No keystore found') console.error(err); // eslint-disable-line no-console
        });
    }
  }

  authMetaMask() {
    const { web3 } = window;

    // check if web3 has been injected into dom window
    if (typeof web3 !== 'undefined') {
      const web3js = new Web3(web3.currentProvider);

      web3js.eth.getAccounts((err, acc) => {
        // don't authenticate if there's already a user or if metamask is unlocked
        if (this.state.currentUser) return; // fix this
        if (!acc[0]) {
          console.log('Show message about unlocking metamask')
          return;
        };

        const authData = {
          strategy: 'web3',
          address: acc[0],
        };
        const util = new Accounts();
        // console.log(test.hashMessage('uRr1tofqbXXG4yAEa2ed'))
        return new Promise((resolve, reject) => {
          feathersClient.authenticate(authData).catch(response => {
            // normal flow will issue a 401 with a challenge message we need to sign and send to
            // verify our identity
            if (response.code === 401 && response.data.startsWith('Challenge =')) {
              const msg = response.data.replace('Challenge =', '').trim();
              resolve(web3js.eth.sign(util.hashMessage(msg), acc[0]));
            }
            reject(response);
          });
        })
          .then(signature => {
            authData.signature = signature;
            return feathersClient.authenticate(authData);
          })
          .then(response => {
            this.onSignIn(acc[0]);
          })
          .catch(err => console.log(err))
      })
    }
  }

  onSignOut() {
    if (this.state.wallet) this.state.wallet.lock();

    feathersClient.logout();
    this.setState({ currentUser: undefined });
  }

  onSignIn(address) {
    let currentAddress = address || this.state.wallet.getAddresses()[0];
    return Application.getUserProfile(currentAddress).then(user =>
      this.setState({ currentUser: new User(user) }),
    );
  }

  handleWalletChange(wallet) {
    wallet.cacheKeystore();
    let address;
    if (typeof web3 !== 'undefined') {
      window.web3.eth.getAccounts((error, accounts) => {
        if (error) alert('error getting eth accounts');
        if (accounts.length === 0)
          alert(
            'Zero accounts found in provided web3 object. You may need to log into a web3 browser or extension.',
          );
        [address] = accounts;
        Application.getUserProfile(address).then(user =>
          this.setState({
            wallet,
            currentUser: new User(user),
          }),
        );
      });
    } else {
      [address] = wallet.getAddresses();
      getWeb3().then(web3 => web3.setWallet(wallet));
      Application.getUserProfile(address).then(user =>
        this.setState({
          wallet,
          currentUser: new User(user),
        }),
      );
    }
    // Unhandled Rejection (TypeError): Cannot read property 'address' of undefined
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
      wallet,
      currentUser,
      web3,
      isLoading,
      hasError,
      showUnlockWalletModal,
      redirectAfter,
    } = this.state;

    return (
      <Router history={history}>
        <div>
          {isLoading && <Loader className="fixed" />}

          {wallet &&
            showUnlockWalletModal && (
              <UnlockWallet
                wallet={wallet}
                redirectAfter={redirectAfter}
                onClose={() => this.walletUnlocked()}
                onCloseClicked={() => this.hideUnlockWalletModal()}
              />
            )}

          {!isLoading &&
            !hasError && (
              <div>
                <MainMenu onSignOut={this.onSignOut} wallet={wallet} currentUser={currentUser} />

                <Switch>
                  {/* Routes are defined here. Persistent data is set as props on components
                  NOTE order matters, wrong order breaks routes!
               */}

                  <Route
                    exact
                    path="/dacs/new"
                    component={props => (
                      <EditDAC isNew currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/dacs/:id"
                    component={props => (
                      <ViewDAC currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/dacs/:id/edit"
                    component={props => (
                      <EditDAC currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />

                  <Route
                    exact
                    path="/campaigns/new"
                    component={props => (
                      <EditCampaign isNew currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/campaigns/:id"
                    component={props => (
                      <ViewCampaign currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/campaigns/:id/edit"
                    component={props => (
                      <EditCampaign currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />

                  <Route
                    exact
                    path="/campaigns/:id/milestones/new"
                    component={props => (
                      <EditMilestone isNew currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/campaigns/:id/milestones/propose"
                    component={props => (
                      <EditMilestone
                        isNew
                        isProposed
                        currentUser={currentUser}
                        wallet={wallet}
                        {...props}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/campaigns/:id/milestones/:milestoneId"
                    component={props => (
                      <ViewMilestone currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/campaigns/:id/milestones/:milestoneId/edit"
                    component={props => (
                      <EditMilestone currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/milestones/:milestoneId/edit"
                    component={props => (
                      <EditMilestone currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/milestones/:milestoneId/edit/proposed"
                    component={props => (
                      <EditMilestone
                        currentUser={currentUser}
                        wallet={wallet}
                        isProposed
                        {...props}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/donations"
                    component={props => (
                      <Donations currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/delegations"
                    component={props => (
                      <Delegations currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/my-dacs"
                    component={props => (
                      <MyDACs currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/my-campaigns"
                    component={props => (
                      <MyCampaigns currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/my-milestones"
                    component={props => (
                      <MyMilestones currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />

                  <Route
                    exact
                    path="/signin"
                    component={props => (
                      <SignIn
                        wallet={wallet}
                        cachedWallet={wallet}
                        onSignIn={this.onSignIn}
                        {...props}
                      />
                    )}
                  />

                  <Route
                    exact
                    path="/signup"
                    render={props => (
                      <Signup
                        provider={web3 ? web3.currentProvider : undefined}
                        walletCreated={this.handleWalletChange}
                        {...props}
                      />
                    )}
                  />

                  <Route
                    exact
                    path="/change-account"
                    render={props => (
                      <ChangeAccount
                        provider={web3 ? web3.currentProvider : undefined}
                        handleWalletChange={this.handleWalletChange}
                        {...props}
                      />
                    )}
                  />

                  <Route
                    exact
                    path="/wallet"
                    component={props => (
                      <UserWallet currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/profile"
                    component={props => (
                      <EditProfile currentUser={currentUser} wallet={wallet} {...props} />
                    )}
                  />
                  <Route
                    exact
                    path="/profile/:userAddress"
                    component={props => <Profile {...props} />}
                  />

                  <DataRoutes currentUser={currentUser} wallet={wallet} />

                  <Route component={NotFound} />
                </Switch>
              </div>
            )}

          {!isLoading &&
            hasError && (
              <center>
                <h2>Oops, something went wrong...</h2>
                <p>The Giveth dapp could not load for some reason. Please try again...</p>
              </center>
            )}

          <ToastContainer
            position="top-right"
            type="default"
            autoClose={5000}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            pauseOnHover
          />
        </div>
      </Router>
    );
  }
}

export default Application;
