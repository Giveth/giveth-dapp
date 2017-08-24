import React, { Component } from 'react'
import BackupWallet from "../BackupWallet"

/**
 Shows the user's profile
 **/

class Profile extends Component {
  render() {
    return (
      <div id="profile-view" className="container-fluid page-layout">
        <center>
          <h1>Profile</h1>
          {this.props.currentUser &&
          <div>
            <h2>Welcome {this.props.currentUser}!</h2>

            <BackupWallet wallet={this.props.wallet}/>
          </div>
          }
        </center>
      </div>
    )
  }
}

export default Profile