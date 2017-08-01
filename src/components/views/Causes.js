import React, { Component } from 'react'
import JoinGivethCommunity from '../JoinGivethCommunity'

/**
  Shows a list of causes
**/

class Causes extends Component {
  render() {
    return (
      <div id="causes-view">
        <JoinGivethCommunity/>

        <div className="container-fluid page-layout">
          <center>
            <h1>Here will be a list of causes</h1>
          </center>
        </div>
      </div>
    )
  } 
}

export default Causes