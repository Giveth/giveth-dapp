import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';

import { Router, Route, Redirect, Switch } from 'react-router-dom';

import localforage from 'localforage';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import Sweetalert from 'sweetalert';

import GA from 'lib/GoogleAnalytics';
import DataRoutes from './DataRoutes';

import { history } from '../lib/helpers';

import config from '../configuration';

// views
import Profile from '../components/views/Profile';
import UserWallet from '../components/views/UserWallet';
import EditProfile from '../components/views/EditProfile';
import SignIn from '../components/views/SignIn';
import Signup from '../components/views/SignUp';
import ChangeAccount from '../components/views/ChangeAccount';
import BackupWallet from '../components/views/BackupWallet';

import ViewMilestone from '../components/views/ViewMilestone';
import EditDAC from '../components/views/EditDAC';
import ViewDAC from '../components/views/ViewDAC';
import Donations from '../components/views/Donations';
import Delegations from '../components/views/Delegations';
import MyDACs from '../components/views/MyDACs';
import MyCampaigns from '../components/views/MyCampaigns';
import MyMilestones from '../components/views/MyMilestones';
import NotFound from '../components/views/NotFound';

import EditCampaign from '../components/views/EditCampaign';
import ViewCampaign from '../components/views/ViewCampaign';
import EditMilestone from '../components/views/EditMilestone';

// components
import MainMenu from '../components/MainMenu';
import Loader from '../components/Loader';
import UnlockWallet from '../components/UnlockWallet';
import ErrorBoundary from '../components/ErrorBoundary';

// context providers
import UserProvider, { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import EthConversionProvider from '../contextProviders/EthConversionProvider';

import '../lib/validators';

/* global document */
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

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 * -> moved to data to UserProvider
 */
class Application extends Component {
  constructor() {
    super();

    localforage.config({
      name: 'giveth',
    });

    // Making unlock wallet global
    // React.unlockWallet = this.unlockWallet;
  }

  render() {
    return (
      <ErrorBoundary>
        {/* Header stuff goes here */}
        {config.analytics.useHotjar &&
          window.location.origin.includes('beta') && (
            <Helmet>
              <script>{`
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:944408,hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `}</script>
            </Helmet>
          )}

        <Router history={history}>
          <EthConversionProvider>
            <UserProvider>
              <UserConsumer>
                {({
                  state: {
                    wallet,
                    currentUser,
                    isLoading,
                    hasError,
                    showUnlockWalletModal,
                    actionAfter,
                  },
                  actions: {
                    onSignIn,
                    onSignOut,
                    walletUnlocked,
                    hideUnlockWalletModal,
                    handleWalletChange,
                  },
                }) => (
                  <div>
                    {GA.init() && <GA.RouteTracker />}

                    {isLoading && <Loader className="fixed" />}

                    {wallet && (
                      <UnlockWallet
                        isOpen={showUnlockWalletModal}
                        wallet={wallet}
                        actionAfter={actionAfter}
                        onClose={walletUnlocked}
                        onCloseClicked={hideUnlockWalletModal}
                      />
                    )}

                    {!isLoading &&
                      !hasError && (
                        <div>
                          <MainMenu onSignOut={onSignOut} />

                          <Switch>
                            {/* Routes are defined here. Persistent data is set as props on components
                                NOTE order matters, wrong order breaks routes!
                            */}

                            <Route
                              exact
                              path="/dacs/new"
                              render={props => (
                                <EditDAC
                                  isNew
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/dacs/:id"
                              render={props => (
                                <ViewDAC currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/dacs/:id/edit"
                              render={props => (
                                <EditDAC currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />

                            <Route
                              exact
                              path="/campaigns/new"
                              render={props => (
                                <EditCampaign
                                  isNew
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/campaigns/:id"
                              render={props => (
                                <ViewCampaign
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/campaigns/:id/edit"
                              render={props => (
                                <EditCampaign
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />

                            <Route
                              exact
                              path="/campaigns/:id/milestones/new"
                              render={props => (
                                <EditMilestone
                                  isNew
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/campaigns/:id/milestones/propose"
                              render={props => (
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
                              render={props => (
                                <ViewMilestone
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/campaigns/:id/milestones/:milestoneId/edit"
                              render={props => (
                                <EditMilestone
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/campaigns/:id/milestones"
                              render={({ match }) => (
                                <Redirect to={`/campaigns/${match.params.id}`} />
                              )}
                            />
                            <Route
                              exact
                              path="/milestones/:milestoneId/edit"
                              render={props => (
                                <EditMilestone
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />
                            <Route
                              exact
                              path="/milestones/:milestoneId/edit/proposed"
                              render={props => (
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
                              render={props => (
                                <Donations currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/delegations"
                              render={props => (
                                <Delegations currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/my-dacs"
                              render={props => (
                                <MyDACs currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/my-campaigns"
                              render={props => (
                                <MyCampaigns currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/my-milestones"
                              render={props => (
                                <MyMilestones
                                  currentUser={currentUser}
                                  wallet={wallet}
                                  {...props}
                                />
                              )}
                            />

                            <Route
                              exact
                              path="/signin"
                              render={props => (
                                <SignIn
                                  wallet={wallet}
                                  cachedWallet={wallet}
                                  onSignIn={onSignIn}
                                  {...props}
                                />
                              )}
                            />

                            <Route
                              exact
                              path="/signup"
                              render={props => (
                                <Signup walletCreated={handleWalletChange} {...props} />
                              )}
                            />

                            <Route
                              exact
                              path="/backupwallet"
                              render={props => <BackupWallet wallet={wallet} {...props} />}
                            />

                            <Route
                              exact
                              path="/change-account"
                              render={props => (
                                <ChangeAccount handleWalletChange={handleWalletChange} {...props} />
                              )}
                            />

                            <Route
                              exact
                              path="/wallet"
                              render={props => (
                                <UserWallet currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/profile"
                              render={props => (
                                <EditProfile currentUser={currentUser} wallet={wallet} {...props} />
                              )}
                            />
                            <Route
                              exact
                              path="/profile/:userAddress"
                              render={props => <Profile {...props} />}
                            />

                            <DataRoutes />

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
                )}
              </UserConsumer>
            </UserProvider>
          </EthConversionProvider>
        </Router>
      </ErrorBoundary>
    );
  }
}

export default Application;
