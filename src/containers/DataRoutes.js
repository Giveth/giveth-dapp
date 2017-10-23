import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'

import { feathersClient } from "../lib/feathersClient";

import DACs from './../components/views/DACs'
import Campaigns from './../components/views/Campaigns'
import Loader from './../components/Loader'

import currentUserModel from './../models/currentUserModel'

/**
  These routes load and keep DACs and Campaigns in state for faster switching of routes
  This could some day move to Redux if needed
**/

class DataRoutes extends Component {
  constructor() {
    super()

    this.state = {
      dacs: [],
      campaigns: [],    
      isLoading: true,
      hasError: false
    }      
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
    ]).then( res => 
        this.setState({ isLoading: false, hasError: false })
      )
      .catch( e => {
        console.log(e)
        this.setState({ isLoading: false, hasError: true })
      })  
  }

  render(){
    const { currentUser, wallet } = this.props
    const { dacs, campaigns, isLoading, hasError } = this.state

    return(
      <div>
        {isLoading &&
          <Loader className="fixed"/>
        }

        {!isLoading && !hasError &&
          <div>
            <Route exact path="/" render={props => <DACs dacs={dacs} currentUser={currentUser} wallet={wallet} {...props}/>} />
            <Route exact path="/dacs" render={props => <DACs dacs={dacs} currentUser={currentUser} wallet={wallet} {...props}/>} />
            <Route exact path="/campaigns" render={props => <Campaigns campaigns={campaigns} currentUser={currentUser} wallet={wallet} {...props}/>} />
          </div>
        }

        { !isLoading && hasError &&
          <center>
            <h2>Oops, something went wrong...</h2>
            <p>The Giveth dapp could not load for some reason. Please try again...</p>
          </center>
        }        

      </div>
    )
  }
}

export default DataRoutes

DataRoutes.propTypes = {
  currentUser: currentUserModel,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool,
    lock: PropTypes.func,
  })
}