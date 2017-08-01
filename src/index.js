import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import registerServiceWorker from './lib/registerServiceWorker'
import { Web3Provider } from 'react-web3';

import './styles/application.css'

// views
import Profile from './components/views/Profile'
import Milestones from './components/views/Milestones'
import Milestone from './components/views/Milestone'
import Causes from './components/views/Causes'
import Cause from './components/views/Cause'
import NotFound from './components/views/NotFound'

// components
import MainMenu from './components/MainMenu'

/**
  Note: 
  This structure will evolve, perhaps to different files. But for now it's ok.

  The App waits for Web3 to be injected, see https://github.com/coopermaruyama/react-web3
**/

ReactDOM.render(
  <Web3Provider>
    <Router>
      <div>
        <MainMenu/>    

        {/* Routes are defined here */}
        <Switch>
          <Route exact path="/" component={Causes}/>
          <Route exact path="/causes" component={Causes}/>
          <Route exact path="/causes/:id" component={Cause}/>
          <Route exact path="/causes/:id/milestones" component={Milestones}/>
          <Route exact path="/causes/:id/milestones/:id" component={Milestone}/>          
          <Route exact path="/profile" component={Profile}/>
          <Route component={NotFound}/>
        </Switch>

      </div>
    </Router>
  </Web3Provider>
  ,document.getElementById('root')
)

registerServiceWorker()
