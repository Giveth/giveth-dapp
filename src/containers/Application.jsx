import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Router, Route, Switch } from 'react-router-dom';
import localforage from 'localforage';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import Sweetalert from 'sweetalert';

import DataRoutes from './DataRoutes';

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

// context providers
import UserProvider, { Consumer as UserConsumer } from '../contextProviders/UserProvider';

import './../lib/validators';

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
    React.unlockWallet = this.unlockWallet;
  }

  render() {
    return (
      <Router history={history}>
        <UserProvider>
          <UserConsumer>
            {({
              state: {
                wallet,
                currentUser,
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
            }) => (
              <div>
                {isLoading && <Loader className="fixed" />}

                {wallet &&
                  showUnlockWalletModal && (
                    <UnlockWallet
                      wallet={wallet}
                      redirectAfter={redirectAfter}
                      onClose={walletUnlocked}
                      onCloseClicked={hideUnlockWalletModal}
                    />
                  )}

                {!isLoading &&
                  !hasError && (
                    <div>
                      <MainMenu onSignOut={onSignOut} wallet={wallet} currentUser={currentUser} />

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
                              onSignIn={onSignIn}
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
                              walletCreated={handleWalletChange}
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
                              handleWalletChange={handleWalletChange}
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
            )}
          </UserConsumer>
        </UserProvider>
      </Router>
    );
  }
}

export default Application;
