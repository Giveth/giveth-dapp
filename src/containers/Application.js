import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import localforage from 'localforage';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';


import { feathersClient } from "../lib/feathersClient";
import GivethWallet from '../lib/blockchain/GivethWallet';
import getWeb3 from "../lib/blockchain/getWeb3";

// views
import Profile from './../components/views/Profile'
import UserWallet from './../components/views/UserWallet'
import EditProfile from './../components/views/EditProfile'
import SignIn from './../components/views/SignIn'
import Signup from './../components/views/Signup'
import ChangeAccount from './../components/views/ChangeAccount'

import ViewMilestone from './../components/views/ViewMilestone'
import DACs from './../components/views/DACs'
import EditDAC from './../components/views/EditDAC'
import ViewDAC from './../components/views/ViewDAC'
import Donations from './../components/views/Donations'
import Delegations from './../components/views/Delegations'
import MyDACs from './../components/views/MyDACs'
import MyCampaigns from './../components/views/MyCampaigns'
import MyMilestones from './../components/views/MyMilestones'
import NotFound from './../components/views/NotFound'

import Campaigns from './../components/views/Campaigns'
import EditCampaign from './../components/views/EditCampaign'
import ViewCampaign from './../components/views/ViewCampaign'
import EditMilestone from './../components/views/EditMilestone'


// components
import MainMenu from './../components/MainMenu'
import Loader from './../components/Loader'
import UnlockWallet from "../components/UnlockWallet";

require('./../lib/validators')


/**
 * Here we hack to make stuff globally available
 *
 */

// Make sweet alert global
React.swal = require('sweetalert')

// Construct a dom node to be used as content for sweet alert
React.swal.msg = (reactNode) => {
  let wrapper = document.createElement("span")
  ReactDOM.render(reactNode, wrapper);  
  return wrapper.firstChild
}

// make toast globally available
React.toast = toast

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile 
React.minimumWalletBalance = 0.02


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
      dacs: [],
      campaigns: [],
      web3: undefined,
      currentUser: undefined,
      isLoading: true,
      hasError: false,
      wallet: undefined,
      unlockWallet: false,
      cachedWallet: true,
      alerts: []
    };

    localforage.config({
      name: 'giveth',
    });

    this.handleWalletChange = this.handleWalletChange.bind(this);

    // we need this global to make opening the unlockWalletModal possible from anywhere in the app
    React.unlockWallet = this.unlockWallet.bind(this);
    React.unlockWallet = this.unlockWallet.bind(this);
  }

  componentWillMount() {
    // Load dacs and campaigns. When we receive first data, we finish loading.
    // This setup is a little ugly, bedac the callback is being called 
    // again and again whenever data changes. Yet the promise will be resolved the first time.
    // But he, it works! ;-)

    Promise.all([
      // Load all the DACS
      new Promise((resolve, reject) => {
        feathersClient.service('dacs').watch({ strategy: 'always' }).find({
          query: {
            delegateId: { 
              $gt: '0' // 0 is a pending dac
            },
            $limit: 200,
            $sort: { campaignsCount: -1 }
          },
        }).subscribe(
          resp => this.setState({ dacs: resp }, resolve()),
          err => reject()
        )
      })
    ,
      // Load all the campaigns
      new Promise((resolve, reject) => {
        feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
          query: {
            projectId: {
              $gt: '0' // 0 is a pending campaign
            },
            status: 'Active',
            $limit: 200,
            $sort: { milestonesCount: -1 }
          },
        }).subscribe(
          resp => this.setState({ campaigns: resp }, resolve()),
          err => reject()

        )
      })
    ,
      // login the user if we have a valid JWT
      new Promise((resolve, reject) => {
        feathersClient.passport.getJWT()
          .then(token => {
            if (token) return feathersClient.passport.verifyJWT(token)
          })
          .then(payload => this.getUserProfile(payload.userId))
          .then(user => {
            if (!user) throw new Error('No User');
            feathersClient.authenticate(); // need to authenticate the socket connection
            resolve(user);
          })
          .catch(()=> resolve())
      })
    ]).then( res => 
        this.setState({ isLoading: false, hasError: false, currentUser: res[2] })
      )
      .catch( e => {
        console.log(e)
        this.setState({ isLoading: false, hasError: true })
      })


    //  Load the wallet if it is cached
    GivethWallet.getCachedKeystore()
      .then(keystore => {
        //TODO change to getWeb3() when implemented. actually remove provider from GivethWallet
        const provider = this.state.web3 ? this.state.web3.currentProvider : undefined;
        return GivethWallet.loadWallet(keystore, provider);
      })
      .then(wallet => {
        getWeb3().then(web3 => web3.setWallet(wallet));
        this.setState({ wallet });
      })
      .catch( err => {
        if (err.message !== 'No keystore found') console.error(err);
        this.setState({
          cachedWallet: false,
        })
      });       


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
        this.setState({ currentUser: user }));
  };

  handleWalletChange(wallet) {
    wallet.cacheKeystore();
    const address = wallet.getAddresses()[ 0 ];

    getWeb3().then(web3 => web3.setWallet(wallet));

    this.getUserProfile(address)
      .then(user =>
        this.setState({
          wallet,
          currentUser: user,
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
    React.toast.success(<p>Your wallet has been unlocked.<br/>Note that your wallet will <strong>auto-lock</strong> upon page refresh.</p>)    
  }

  hideUnlockWalletModal() {
    this.setState({ showUnlockWalletModal: false, redirectAfter: undefined})
  }


  render() {

    const { wallet, currentUser, dacs, campaigns, web3, isLoading, hasError, showUnlockWalletModal, redirectAfter } = this.state

    return (
      <Router>
        <div>
          <MainMenu
            onSignOut={this.onSignOut}
            wallet={wallet}
            currentUser={currentUser}/>

          {isLoading &&
            <Loader className="fixed"/>
          }

          {wallet && showUnlockWalletModal &&
            <UnlockWallet
              wallet={wallet}
              redirectAfter={redirectAfter}
              onClose={() => this.walletUnlocked()}
              onCloseClicked={() => this.hideUnlockWalletModal()}/>
          }

          {!isLoading && !hasError &&
            <div>
              {/* Routes are defined here. Persistent data is set as props on components */}
              <Switch>
                <Route exact path="/" component={props => <DACs dacs={dacs} currentUser={currentUser} wallet={wallet} {...props}/>} />

                <Route exact path="/dacs" component={props => <DACs dacs={dacs} currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/dacs/new" component={props => <EditDAC isNew={true} currentUser={currentUser} walletUnlocked={wallet} {...props}/>} />
                <Route exact path="/dacs/:id" component={props => <ViewDAC currentUser={currentUser} wallet={wallet} {...props}/>} />                        
                <Route exact path="/dacs/:id/edit" component={props => <EditDAC currentUser={currentUser} wallet={wallet} {...props}/>} />  

                <Route exact path="/campaigns" component={props => <Campaigns campaigns={campaigns} currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/campaigns/new" component={props => <EditCampaign isNew={true} currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/campaigns/:id" component={props => <ViewCampaign currentUser={currentUser} wallet={wallet} {...props} /> }/>
                <Route exact path="/campaigns/:id/edit" component={props => <EditCampaign currentUser={currentUser} wallet={wallet} {...props}/>} />

                <Route exact path="/campaigns/:id/milestones/new" component={props => <EditMilestone isNew={true} currentUser={currentUser} wallet={wallet} {...props} />}/>
                <Route exact path="/campaigns/:id/milestones/:milestoneId" component={props => <ViewMilestone currentUser={currentUser} wallet={wallet} {...props} />}/>
                <Route exact path="/campaigns/:id/milestones/:milestoneId/edit" component={props => <EditMilestone currentUser={currentUser} wallet={wallet} {...props} />}/>

                <Route exact path="/donations" component={props => <Donations currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/delegations" component={props => <Delegations currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/my-dacs" component={props => <MyDACs currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/my-campaigns" component={props => <MyCampaigns currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/my-milestones" component={props => <MyMilestones currentUser={currentUser} wallet={wallet} {...props}/>} />

                <Route exact path="/signin" render={props => <SignIn wallet={wallet} cachedWallet={wallet} onSignIn={this.onSignIn} {...props}/>} />

                <Route exact path="/signup" render={props =>
                  <Signup
                    provider={web3 ? web3.currentProvider : undefined}
                    walletCreated={this.handleWalletChange}
                    {...props}/>} />

                <Route exact path="/change-account" render={props =>
                  <ChangeAccount
                    provider={web3 ? web3.currentProvider : undefined}
                    handleWalletChange={this.handleWalletChange}
                    {...props}/>} />

                <Route exact path="/wallet" component={props => <UserWallet currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/profile" component={props => <EditProfile currentUser={currentUser} wallet={wallet} {...props}/>} />
                <Route exact path="/profile/:userAddress" component={props => <Profile {...props}/>} />

                <Route component={NotFound}/>
              </Switch>
            </div>
          }

          { !isLoading && hasError &&
            <center>
              <h2>Oops, something went wrong...</h2>
              <p>The Giveth dapp could not load for some reason. Please try again...</p>
            </center>
          }

          <ToastContainer 
            position="top-right"
            type="default"
            autoClose={5000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
          />          

        </div>
      </Router>
    )
  }
}

export default Application
