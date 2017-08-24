import React, { Component } from 'react'
import PropTypes from 'prop-types'

import BackupWallet from "../BackupWallet"
import { isAuthenticated } from "../../lib/middleware"

/**
 Shows the user's wallet
 **/

class UserWallet extends Component {
  componentWillMount(){
    isAuthenticated(this.props.currentUser, this.props.history)
  }

  render() {
    return (
      <div id="profile-view" className="container-fluid page-layout">
        <center>
          <h1>Your wallet</h1>
          {this.props.currentUser &&
          <div>
            <p>{this.props.currentUser}</p>
            <BackupWallet wallet={this.props.wallet}/>
          </div>
          }
        </center>
      </div>
    )
  }
}

export default UserWallet

UserWallet.propTypes = {
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired,
}