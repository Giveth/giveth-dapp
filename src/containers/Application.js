import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import localforage from 'localforage';

import loadAndWatchFeatherJSResource from '../lib/loadAndWatchFeatherJSResource'
import Web3Monitor from '../lib/Web3Monitor';

// views
import Profile from './../components/views/Profile'
import SignIn from './../components/views/SignIn'

import ViewMilestone from './../components/views/ViewMilestone'
import Causes from './../components/views/Causes'
import EditCause from './../components/views/EditCause'
import ViewCause from './../components/views/ViewCause'
import NotFound from './../components/views/NotFound'
import WalletDemo from './../components/views/WalletDemo'

import Campaigns from './../components/views/Campaigns'
import EditCampaign from './../components/views/EditCampaign'
import ViewCampaign from './../components/views/ViewCampaign'
import EditMilestone from './../components/views/EditMilestone'


// components
import MainMenu from './../components/MainMenu'
import Loader from './../components/Loader'

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
      currentUser: '',
      isLoading: true,
      hasError: false,
      wallet: undefined,
    };

    localforage.config({
      name: 'giveth',
    });

    this.handleWalletChange = this.handleWalletChange.bind(this);
  }
 
  componentWillMount(){
    // Load causes and campaigns. When we receive first data, we finish loading.
    // This setup is a little ugly, because the callback is being called 
    // again and again by loadAndWatchFeatherJSResource whenever data changes.
    // Yet the promise will be resolved the first time.
    // But he, it works! ;-)

    Promise.all([
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('causes', {}, (resp, err) => {
          if(resp) {
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
          if(resp) {
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
      })

    // QUESTION: Should rendering with for this to load?
    // new Web3Monitor(({web3}) => {
    //   this.setState({
    //     web3
    //   })
    // })
  }

  handleWalletChange(wallet) {
    if (wallet) {
     localforage.setItem('keystore', wallet.getKeystore());
      this.setState({
        wallet,
        currentUser: wallet.getAddresses()[0],
      });
    } else {

      if (this.state.wallet) this.state.wallet.clear();

      localforage.removeItem('keystore');
      this.setState({
        wallet,
        currentUser: undefined,
      });
    }
  }

  render(){

    return(
      <Router>
        <div>
          <MainMenu authenticated={(this.state.currentUser)}/>

          { this.state.isLoading && 
            <Loader className="fixed"/>
          }

          { !this.state.isLoading && !this.state.hasError &&
            <div>
              {/* Routes are defined here. Persistent data is set as props on components */}
              <Switch>
                <Route exact path="/" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} {...props}/>} />
                
                <Route exact path="/dacs" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} {...props}/>} />
                <Route exact path="/dacs/new" component={props => <EditCause isNew="true" currentUser={this.state.currentUser} {...props}/>} />                        
                <Route exact path="/dacs/:id" component={ViewCause}/>
                <Route exact path="/dacs/:id/edit" component={props => <EditCause currentUser={this.state.currentUser} {...props}/>} />  

                <Route exact path="/campaigns" component={props => <Campaigns campaigns={this.state.campaigns} currentUser={this.state.currentUser} {...props}/>} />
                <Route exact path="/campaigns/new" component={props => <EditCampaign isNew="true" currentUser={this.state.currentUser} {...props}/>} />                        
                <Route exact path="/campaigns/:id" component={props => <ViewCampaign currentUser={this.state.currentUser} {...props} /> }/>
                <Route exact path="/campaigns/:id/edit" component={props => <EditCampaign currentUser={this.state.currentUser} {...props}/>} />   

                <Route exact path="/campaigns/:id/milestones/new" component={props => <EditMilestone isNew={true} currentUser={this.state.currentUser} {...props} />}/>
                <Route exact path="/campaigns/:id/milestones/:milestoneId" component={props => <ViewMilestone currentUser={this.state.currentUser} {...props} />}/>          
                <Route exact path="/campaigns/:id/milestones/:milestoneId/edit" component={props => <EditMilestone currentUser={this.state.currentUser} {...props} />}/>       
                             
                <Route exact path="/signin" render={props => <SignIn wallet={this.state.wallet} handleWalletChange={this.handleWalletChange} provider={this.state.web3 ? this.state.web3.currentProvider : undefined} {...props}/>} />
                <Route exact path="/profile" component={props => <Profile currentUser={this.state.currentUser} {...props}/>} />

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

        </div>
      </Router>
    )
  }
}

export default Application
