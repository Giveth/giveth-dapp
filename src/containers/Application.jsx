import React, { Component, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';

import { Router, Route, Redirect, Switch } from 'react-router-dom';

import localforage from 'localforage';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import Sweetalert from 'sweetalert';

import GA from 'lib/GoogleAnalytics';

import { history } from '../lib/helpers';

import config from '../configuration';

// views
import Profile from '../components/views/Profile';
// import UserWallet from '../components/views/UserWallet';
import EditProfile from '../components/views/EditProfile';

// components
import MainMenu from '../components/MainMenu';
import Loader from '../components/Loader';
import ErrorBoundary from '../components/ErrorBoundary';

// context providers
import UserProvider, { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import ConversionRateProvider from '../contextProviders/ConversionRateProvider';
import Web3Provider, { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import WhiteListProvider, {
  Consumer as WhiteListConsumer,
} from '../contextProviders/WhiteListProvider';

import '../lib/validators';

const ViewMilestone = React.lazy(() => import('../components/views/ViewMilestone'));
const EditDAC = React.lazy(() => import('../components/views/EditDAC'));
const ViewDAC = React.lazy(() => import('../components/views/ViewDAC'));
const Donations = React.lazy(() => import('../components/views/Donations'));
const Delegations = React.lazy(() => import('../components/views/Delegations'));
const MyDACs = React.lazy(() => import('../components/views/MyDACs'));
const MyCampaigns = React.lazy(() => import('../components/views/MyCampaigns'));
const MyMilestones = React.lazy(() => import('../components/views/MyMilestones'));
const NotFound = React.lazy(() => import('../components/views/NotFound'));
const Explore = React.lazy(() => import('../components/views/Explore'));
const Milestones = React.lazy(() => import('../components/views/Milestones'));
const Campaigns = React.lazy(() => import('../components/views/Campaigns'));
const DACs = React.lazy(() => import('../components/views/DACs'));

const EditCampaign = React.lazy(() => import('../components/views/EditCampaign'));
const ViewCampaign = React.lazy(() => import('../components/views/ViewCampaign'));
const EditMilestone = React.lazy(() => import('../components/views/EditMilestone'));

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

// Path and it's donate sub path
const getViewEntityPathsList = originPath => {
  return [originPath, `${originPath}/donate`];
};

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 * -> moved to data to UserProvider
 */
class Application extends Component {
  constructor(props) {
    super(props);

    localforage.config({
      name: 'giveth',
    });

    this.state = {
      web3Loading: true,
      userLoading: true,
    };

    this.web3Loaded = this.web3Loaded.bind(this);
    this.userLoaded = this.userLoaded.bind(this);
  }

  web3Loaded() {
    this.setState({ web3Loading: false });
  }

  userLoaded() {
    this.setState({ userLoading: false });
  }

  render() {
    const { web3Loading, userLoading } = this.state;
    return (
      <ErrorBoundary>
        {/* Header stuff goes here */}
        {config.analytics.useHotjar && window.location.origin.includes('beta') && (
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
          <WhiteListProvider>
            <WhiteListConsumer>
              {({ state: { fiatWhitelist, isLoading } }) => (
                <div>
                  {isLoading && <Loader className="fixed" />}
                  {!isLoading && (
                    <Web3Provider onLoaded={this.web3Loaded}>
                      <Web3Consumer>
                        {({
                          state: { account, balance, isForeignNetwork },
                          actions: { displayForeignNetRequiredWarning },
                        }) => (
                          <div>
                            {web3Loading && <Loader className="fixed" />}
                            {!web3Loading && (
                              <ConversionRateProvider fiatWhitelist={fiatWhitelist}>
                                <UserProvider account={account} onLoaded={this.userLoaded}>
                                  <UserConsumer>
                                    {({ state: { currentUser, hasError } }) => (
                                      <div>
                                        {GA.init() && <GA.RouteTracker />}

                                        {userLoading && <Loader className="fixed" />}

                                        {!userLoading && !hasError && (
                                          <div>
                                            <MainMenu />

                                            <Suspense fallback={<Loader className="fixed" />}>
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
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path={getViewEntityPathsList('/dacs/:id')}
                                                  render={props => (
                                                    <ViewDAC
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/dacs/:id/edit"
                                                  render={props => (
                                                    <EditDAC
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      {...props}
                                                    />
                                                  )}
                                                />

                                                <Route
                                                  exact
                                                  path="/campaigns/new"
                                                  render={props => (
                                                    <EditCampaign
                                                      isNew
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path={getViewEntityPathsList('/campaigns/:id')}
                                                  render={props => (
                                                    <ViewCampaign
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/campaigns/:id/edit"
                                                  render={props => (
                                                    <EditCampaign
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
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
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
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
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path={getViewEntityPathsList(
                                                    '/campaigns/:id/milestones/:milestoneId',
                                                  )}
                                                  render={props => (
                                                    <ViewMilestone
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/campaigns/:id/milestones/:milestoneId/edit"
                                                  render={props => (
                                                    <EditMilestone
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/campaigns/:id/milestones/:milestoneId/edit/proposed"
                                                  render={props => (
                                                    <EditMilestone
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      isProposed
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/campaigns/:id/milestones"
                                                  render={({ match }) => (
                                                    <Redirect
                                                      to={`/campaigns/${match.params.id}`}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/donations"
                                                  render={props => (
                                                    <Donations
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/delegations"
                                                  render={props => (
                                                    <Delegations
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/my-dacs"
                                                  render={props => (
                                                    <MyDACs
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/my-campaigns"
                                                  render={props => (
                                                    <MyCampaigns
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/my-milestones"
                                                  render={props => (
                                                    <MyMilestones
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      {...props}
                                                    />
                                                  )}
                                                />

                                                {/* <Route
                                        exact
                                        path="/wallet"
                                        render={props => (
                                          <UserWallet
                                            currentUser={currentUser}
                                            // wallet={wallet}
                                            {...props}
                                          />
                                        )}
                                      /> */}
                                                <Route
                                                  exact
                                                  path="/profile"
                                                  render={props => (
                                                    <EditProfile
                                                      key={currentUser ? currentUser.id : 0}
                                                      currentUser={currentUser}
                                                      balance={balance}
                                                      isForeignNetwork={isForeignNetwork}
                                                      displayForeignNetRequiredWarning={
                                                        displayForeignNetRequiredWarning
                                                      }
                                                      {...props}
                                                    />
                                                  )}
                                                />
                                                <Route
                                                  exact
                                                  path="/profile/:userAddress"
                                                  render={props => <Profile {...props} />}
                                                />

                                                <Route
                                                  exact
                                                  path="/"
                                                  render={props => <Explore {...props} />}
                                                />
                                                <Route
                                                  exact
                                                  path="/milestones"
                                                  render={props => <Milestones {...props} />}
                                                />
                                                <Route
                                                  exact
                                                  path="/campaigns"
                                                  render={props => <Campaigns {...props} />}
                                                />
                                                <Route
                                                  exact
                                                  path="/dacs"
                                                  render={props => <DACs {...props} />}
                                                />

                                                <Route component={NotFound} />
                                              </Switch>
                                            </Suspense>
                                          </div>
                                        )}

                                        {!userLoading && hasError && (
                                          <div className="text-center">
                                            <h2>Oops, something went wrong...</h2>
                                            <p>
                                              The Giveth dapp could not load for some reason. Please
                                              try again...
                                            </p>
                                          </div>
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
                              </ConversionRateProvider>
                            )}
                          </div>
                        )}
                      </Web3Consumer>
                    </Web3Provider>
                  )}
                </div>
              )}
            </WhiteListConsumer>
          </WhiteListProvider>
        </Router>
      </ErrorBoundary>
    );
  }
}

export default Application;
