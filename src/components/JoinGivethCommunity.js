import React, { Component } from 'react'
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom'


/**
  The join Giveth community top-bar
**/

class JoinGivethCommunity extends Component {
  render() {
    const btnClass = "btn btn-info " + (this.props.authenticated ? "" : "disabled");

    return (
      <div id="join-giveth-community">
        <center>
          <h3>Together we will save the world!</h3>

          <a className="btn btn-success" href="https://giveth.slack.com/" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-slack"></i>
            &nbsp;Join Giveth
          </a>
          
          &nbsp;

          <Link className={btnClass} to="/dacs/new">Create a DAC</Link>
          <Link className={btnClass} to="/campaigns/new">Start a Campaign</Link>
        </center>
      </div>
    )
  } 
}

export default JoinGivethCommunity

JoinGivethCommunity.propTypes = {
  authenticated: PropTypes.string,
}