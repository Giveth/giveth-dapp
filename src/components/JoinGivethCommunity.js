import React, { Component } from 'react'
import { Link } from 'react-router-dom'


import '../styles/joinGivethCommunity.css'

/**
  The join Giveth community top-bar
**/

class JoinGivethCommunity extends Component {
  render() {
    return (
      <div id="join-giveth-community">
        <center>
          <h3>Together we will save the world</h3>

          <a className="btn btn-success" href="https://giveth.slack.com/" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-slack"></i>
            &nbsp;Join Giveth
          </a>
          
          &nbsp;

          <Link className="btn btn-outline-primary" to="/dacs/new">Create a DAC</Link>      
          <Link className="btn btn-outline-primary" to="/campaigns/new">Start a Campaign</Link>      
        </center>
      </div>
    )
  } 
}

export default JoinGivethCommunity