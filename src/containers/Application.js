import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import loadAndWatchFeatherJSResource from '../lib/loadAndWatchFeatherJSResource'

// views
import Profile from './../components/views/Profile'
import Milestones from './../components/views/Milestones'
import ViewMilestone from './../components/views/ViewMilestone'
import Causes from './../components/views/Causes'
import ViewCause from './../components/views/ViewCause'
import NotFound from './../components/views/NotFound'
import EditCause from './../components/views/EditCause'

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
      isLoading: true
    }
  }
 
  componentWillMount(){
    new loadAndWatchFeatherJSResource('causes', (data) => 
      this.setState({ causes: data, isLoading: false }))   

    new loadAndWatchFeatherJSResource('milestones', (data) => 
      this.setState({ milestones: data, isLoading: false }))   

    new loadAndWatchFeatherJSResource('campaigns', (data) => 
      this.setState({ campaigns: data, isLoading: false }))         
  }

  render(){

    return(
      <Router>
        <div>
          <MainMenu/>    

          { this.state.isLoading && 
            <Loader className="fixed"/>
          }

          { !this.state.isLoading &&
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
                
                <Route exact path="/profile" component={Profile}/>
                
                <Route component={NotFound}/>
              </Switch>
            </div>
          }

        </div>
      </Router>
    )
  }
}

export default Application
