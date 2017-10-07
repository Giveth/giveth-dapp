import React, { Component } from 'react'
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom'

import CommunityButton from './CommunityButton'

import currentUserModel from '../models/currentUserModel'

/**
  The join Giveth community top-bar
**/

class JoinGivethCommunity extends Component {
  render() {
    const btnClass = "btn btn-info " + ((this.props.currentUser && this.props.walletUnlocked) ? "" : "disabled");

    return (
      <div id="join-giveth-community">
        <div className="vertical-align">
          <center>
            <h3>Together we will save the world!</h3>

            <CommunityButton className="btn btn-success" url="https://giveth.slack.com">
              &nbsp;Join Giveth
            </CommunityButton>
            
            &nbsp;

            <Link className={btnClass} to="/dacs/new">Create a Community</Link>
            <Link className={btnClass} to="/campaigns/new">Start a Campaign</Link>
          </center>
        </div>
      </div>
    )
  } 
}

export default JoinGivethCommunity

JoinGivethCommunity.propTypes = {
  currentUser: currentUserModel,
  walletUnlocked: PropTypes.bool
}