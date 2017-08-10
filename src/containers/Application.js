import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import { feathersClient, socket } from '../lib/feathersClient'

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
      campaignsData: [],
      page: 1,
      currentUser: "KJkjiquwekn98"
    }

    this.causesService = feathersClient.service('/causes')
    this.milestoneService = feathersClient.service('/milestones')
  }

  getCauses(){
    const self = this

    socket.emit('causes::find', {}, (error, data) => {
      if(data){
        // console.info('Found all causes', data);
        self.setState({ causes: data })
      }
    });
  }  

  componentWillMount(){
    const self = this

    this.getCauses()

    // when a new cause is added, push them to the UI
    this.causesService.on("created", cause => {
      let causes = self.state.causes
      causes.data.push(cause)
      causes.total++
      self.setState({ causes: causes })
    })

    // when a new cause is removed, remove it from the UI
    this.causesService.on("removed", cause => {
      console.log('remove cause: ', cause)
      let causes = self.state.causes
      
      causes.data = causes.data.filter(function(c){
        return c._id !== cause._id
      })
      causes.total--
      self.setState({ causes: causes })
    })    

  }

  render(){

    return(
      <Router>
        <div>
          <MainMenu/>    

          {/* Routes are defined here. Persistent data is set as props on components */}
          <Switch>
            <Route exact path="/" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser}/>} />
            <Route exact path="/causes" component={props => <Causes causes={this.state.causes} currentUser={this.state.currentUser} />} />
            <Route exact path="/causes/new" component={props => <EditCause isNew="true" currentUser={this.state.currentUser} />} />                        
            <Route exact path="/causes/:id" component={ViewCause}/>
            <Route exact path="/causes/:id/edit" component={EditCause}/>            
            <Route exact path="/causes/:id/milestones" component={Milestones}/>
            <Route exact path="/causes/:id/milestones/:id" component={ViewMilestone}/>          
            <Route exact path="/profile" component={Profile}/>
            <Route component={NotFound}/>
          </Switch>

        </div>
      </Router>
    )
  }
}

export default Application
