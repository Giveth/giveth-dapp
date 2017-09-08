import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import localforage from 'localforage';

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

import loadAndWatchFeatherJSResource from '../lib/loadAndWatchFeatherJSResource'
import { feathersClient } from "../lib/feathersClient";
import GivethWallet from '../lib/GivethWallet';

import AppGlobals from './../containers/App'

// views
import Profile from './../components/views/Profile'
import UserWallet from './../components/views/UserWallet'
import EditProfile from './../components/views/EditProfile'
import SignIn from './../components/views/SignIn'
import Signup from './../components/views/Signup'
import ChangeAccount from './../components/views/ChangeAccount'

import ViewMilestone from './../components/views/ViewMilestone'
import Causes from './../components/views/Causes'
import EditCause from './../components/views/EditCause'
import ViewCause from './../components/views/ViewCause'
import Donations from './../components/views/Donations'
import Delegations from './../components/views/Delegations'
import MyCauses from './../components/views/MyCauses'
import MyCampaigns from './../components/views/MyCampaigns'
import NotFound from './../components/views/NotFound'

import Campaigns from './../components/views/Campaigns'
import EditCampaign from './../components/views/EditCampaign'
import ViewCampaign from './../components/views/ViewCampaign'
import EditMilestone from './../components/views/EditMilestone'


// components
import MainMenu from './../components/MainMenu'
import Loader from './../components/Loader'
import UnlockWallet from "../components/UnlockWallet";

// Hack to make things globaly available
React.swal = require('sweetalert')
React.toast = toast

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent, if passed as props to children.
 */

class Application extends Component {
  constructor() {
    super()

    this.state = {
      milestones: [],
      causes: [],
      campaigns: [],
      web3: undefined,
      currentUser: undefined,
      isLoading: true,
      hasError: false,
      wallet: undefined,
      unlockWallet: false,
      cachedWallet: true,
      userProfile: undefined
    };

    localforage.config({
      name: 'giveth',
    });

    this.handleWalletChange = this.handleWalletChange.bind(this);

    // we need this global to make opening the unlockWalletModal possible from anywhere in the app
    React.unlockWallet = this.unlockWallet.bind(this);
    AppGlobals.unlockWallet = this.unlockWallet.bind(this);
  }

  componentWillMount() {
    // Load causes and campaigns. When we receive first data, we finish loading.
    // This setup is a little ugly, because the callback is being called 
    // again and again by loadAndWatchFeatherJSResource whenever data changes.
    // Yet the promise will be resolved the first time.
    // But he, it works! ;-)

    Promise.all([
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('causes', {}, (resp, err) => {
          if (resp) {
            this.setState({ causes: resp })
            resolve()
          } else {
            reject()
          }
        })
      })
      ,
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('campaigns', {}, (resp, err) => {
          if (resp) {
            this.setState({ campaigns: resp })
            resolve()
          } else {
            reject()
          }
        })
      })
    ]).then(() => this.setState({ isLoading: false, hasError: false }))
      .catch((e) => {
        console.log('error loading', e)
        this.setState({ isLoading: false, hasError: true })
      });

    // Load the wallet if it is cached
    GivethWallet.getCachedKeystore()
      .then(keystore => {
        //TODO change to getWeb3() when implemented
        const provider = this.state.web3 ? this.state.web3.currentProvider : undefined;
        return GivethWallet.loadWallet(keystore, provider);
      })
      .then(wallet => this.setState({ wallet }))
      .catch(err => {
        console.log(err);
        this.setState({
          cachedWallet: false,
        })
      });

    // login the user if we have a valid JWT
    feathersClient.passport.getJWT()
      .then(token => feathersClient.passport.verifyJWT(token))
      .then(payload => this.getUserProfile(payload.userId))
      .then(user => {
        this.setState({
          currentUser: user.address,
          userProfile: user,
        });
        feathersClient.authenticate(); // need to authenticate the socket connection
      })
      .catch(console.log);

    // QUESTION: Should rendering wait for this to load?
    // new Web3Monitor(({web3}) => {
    //   this.setState({
    //     web3
    //   })
    // })
  }

  onSignOut = () => {
    if (this.state.wallet) this.state.wallet.lock();

    feathersClient.logout();
    this.setState({ currentUser: undefined });
  };

  onSignIn = () => {
    const address = this.state.wallet.getAddresses()[ 0 ];
    return this.getUserProfile(address)
      .then(user =>
        this.setState({
          currentUser: address,
          userProfile: user
        }));
  };

  handleWalletChange(wallet) {
    wallet.cacheKeystore();
    const address = wallet.getAddresses()[ 0 ];

    this.getUserProfile(address)
      .then(user =>
        this.setState({
          wallet,
          currentUser: wallet.getAddresses()[ 0 ],
          userProfile: user,
          cachedWallet: true,
      }));
  }

  getUserProfile(address) {
    return feathersClient.service('/users').get(address)
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
//      this.props.history.goBack();
      });
  }


  unlockWallet(redirectAfter) {
    this.setState({ showUnlockWalletModal: true, redirectAfter: redirectAfter })
  }  

  walletUnlocked() {
    this.hideUnlockWalletModal()
    React.toast.success("Your wallet has been unlocked!")    
  }

  hideUnlockWalletModal() {
    this.setState({ showUnlockWalletModal: false, redirectAfter: undefined})
  }


  render() {

    return (
      <Router>
        <div>
          <MainMenu
            authenticated={(this.state.currentUser)}
            onSignOut={this.onSignOut}
            wallet={this.state.wallet}
            userProfile={this.state.userProfile}/>

          {this.state.isLoading &&
            <Loader className="fixed"/>
          }

          {this.state.wallet && this.state.showUnlockWalletModal &&
            <UnlockWallet 
              wallet={this.state.wallet} 
              redirectAfter={this.state.redirectAfter} 
              onClose={() => this.walletUnlocked()}
              onCloseClicked={() => this.hideUnlockWalletModal()}/>
          }

          {!this.state.isLoading && !this.state.hasError &&
            <div>
              {/* Routes are defined here. Persistent data is set as props on components */}
              <Switch>
                <Route exact path="/" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} {...props}/>} />
                
                <Route exact path="/dacs" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />
                <Route exact path="/dacs/new" component={props => <EditCause isNew={true} currentUser={this.state.currentUser} walletUnlocked={this.state.wallet} {...props}/>} />                        
                <Route exact path="/dacs/:id" component={ViewCause}/>
                <Route exact path="/dacs/:id/edit" component={props => <EditCause currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />  

                <Route exact path="/campaigns" component={props => <Campaigns campaigns={this.state.campaigns} currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />
                <Route exact path="/campaigns/new" component={props => <EditCampaign isNew={true} currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />                        
                <Route exact path="/campaigns/:id" component={props => <ViewCampaign currentUser={this.state.currentUser} {...props} /> }/>
                <Route exact path="/campaigns/:id/edit" component={props => <EditCampaign currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />   

                <Route exact path="/campaigns/:id/milestones/new" component={props => <EditMilestone isNew={true} currentUser={this.state.currentUser} wallet={this.state.wallet} {...props} />}/>
                <Route exact path="/campaigns/:id/milestones/:milestoneId" component={props => <ViewMilestone currentUser={this.state.currentUser} {...props} />}/>          
                <Route exact path="/campaigns/:id/milestones/:milestoneId/edit" component={props => <EditMilestone currentUser={this.state.currentUser} wallet={this.state.wallet} {...props} />}/>       
                          
                <Route exact path="/donations" component={props => <Donations currentUser={this.state.currentUser} {...props}/>} />
                <Route exact path="/delegations" component={props => <Delegations currentUser={this.state.currentUser} {...props}/>} />
                <Route exact path="/my-causes" component={props => <MyCauses currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />
                <Route exact path="/my-campaigns" component={props => <MyCampaigns currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />

                <Route exact path="/signin" render={props => <SignIn wallet={this.state.wallet} cachedWallet={this.state.wallet} onSignIn={this.onSignIn} {...props}/>} />
                
                <Route exact path="/signup" render={props => 
                  <Signup 
                    provider={this.state.web3 ? this.state.web3.currentProvider : undefined}
                    walletCreated={this.handleWalletChange}                     
                    {...props}/>} />
                
                <Route exact path="/change-account" render={props => 
                  <ChangeAccount 
                    provider={this.state.web3 ? this.state.web3.currentProvider : undefined}
                    handleWalletChange={this.handleWalletChange}                     
                    {...props}/>} />

                <Route exact path="/wallet" component={props => <UserWallet currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />
                <Route exact path="/profile" component={props => <EditProfile currentUser={this.state.currentUser} wallet={this.state.wallet} {...props}/>} />
                <Route exact path="/profile/:userAddress" component={props => <Profile {...props}/>} />

                <Route component={NotFound}/>
              </Switch>
            </div>
          }

          { !this.state.isLoading && this.state.hasError &&
            <center>
              <h2>Oops, something went wrong...</h2>
              <p>The Giveth dapp could not load for some reason. Please try again...</p>
            </center>
          }

          <ToastContainer 
            position="top-right"
            type="success"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
          />          

        </div>
      </Router>
    )
  }
}

export default Application
