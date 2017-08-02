import React, { Component } from 'react'

import '../styles/joinGivethCommunity.css'

class JoinGivethCommunity extends Component {
  render() {
    return (
      <div id="join-giveth-community">
        <center>
          <h3>Together we will save the world</h3>

          <a className="btn btn-success btn-lg" href="https://giveth.slack.com/" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-slack"></i>
            &nbsp;Join Giveth
          </a>

        </center>
      </div>
    )
  } 
}

export default JoinGivethCommunity