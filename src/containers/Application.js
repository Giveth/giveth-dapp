import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import loadAndWatchFeatherJSResource from '../lib/loadAndWatchFeatherJSResource'

// views
import Profile from './../components/views/Profile'
import Milestones from './../components/views/Milestones'
import ViewMilestone from './../components/views/ViewMilestone'
import Causes from './../components/views/Causes'
import EditCause from './../components/views/EditCause'
import ViewCause from './../components/views/ViewCause'
import NotFound from './../components/views/NotFound'

import Campaigns from './../components/views/Campaigns'
import EditCampaign from './../components/views/EditCampaign'
import ViewCampaign from './../components/views/ViewCampaign'


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
      currentUser: "KJkjiquwekn98",
      isLoading: true,
      hasError: false
    }
  }
 
  componentWillMount(){
    // Load causes and campaigns. When we receive first data, we finish loading.
    Promise.all([
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('causes', (resp, err) => {
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
        new loadAndWatchFeatherJSResource('campaigns', (resp, err) => {
          if(resp) {
            this.setState({ campaigns: resp })
            resolve()
          } else {
            reject()
          }
        })
      })        
    ]).then(() => this.setState({ isLoading: false, hasError: false }))
      .catch(() => this.setState({ isLoading: false, hasError: true }))
    
  }

  render(){

    return(
      <Router>
        <div>
          <MainMenu/>    

          { this.state.isLoading && 
            <Loader className="fixed"/>
          }

          { !this.state.isLoading && !this.state.hasError &&
            <div>
              {/* Routes are defined here. Persistent data is set as props on components */}
              <Switch>
                <Route exact path="/" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} {...props}/>} />
                
                <Route exact path="/causes" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} {...props}/>} />
                <Route exact path="/causes/new" component={props => <EditCause isNew="true" currentUser={this.state.currentUser} {...props}/>} />                        
                <Route exact path="/causes/:id" component={ViewCause}/>
                <Route exact path="/causes/:id/edit" component={EditCause}/>            
                <Route exact path="/causes/:id/milestones" component={Milestones}/>
                <Route exact path="/causes/:id/milestones/:id" component={ViewMilestone}/>          

                <Route exact path="/campaigns" component={props => <Campaigns campaigns={this.state.campaigns} currentUser={this.state.currentUser} {...props}/>} />
                <Route exact path="/campaigns/new" component={props => <EditCampaign isNew="true" currentUser={this.state.currentUser} {...props}/>} />                        
                <Route exact path="/campaigns/:id" component={ViewCampaign}/>
                <Route exact path="/campaigns/:id/edit" component={EditCampaign}/>                 
                
                <Route exact path="/profile" component={Profile}/>
                
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
