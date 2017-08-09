import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import feathersClient from '../lib/feathersClient'

// views
import Profile from './../components/views/Profile'
import Milestones from './../components/views/Milestones'
import Milestone from './../components/views/Milestone'
import Causes from './../components/views/Causes'
import Cause from './../components/views/Cause'
import NotFound from './../components/views/NotFound'

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
      page: 1
    }

    this.causesService = feathersClient.service('/causes')
    this.milestoneService = feathersClient.service('/milestones')
  }

  getCauses(){
    const self = this

    feathersClient.emit('causes::find', {}, (error, data) => {
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

  }

  render(){

    return(
      <Router>
        <div>
          <MainMenu/>    

          {/* Routes are defined here. Persistent data is set as props on components */}
          <Switch>
            <Route exact path="/" component={props => <Causes causes={this.state.causes} />} />
            <Route exact path="/causes" component={props => <Causes causes={this.state.causes} />} />
            <Route exact path="/causes/:id" component={Cause}/>
            <Route exact path="/causes/:id/milestones" component={Milestones}/>
            <Route exact path="/causes/:id/milestones/:id" component={Milestone}/>          
            <Route exact path="/profile" component={Profile}/>
            <Route component={NotFound}/>
          </Switch>

        </div>
      </Router>
    )
  }
}

export default Application
