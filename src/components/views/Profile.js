import React, { Component } from 'react'

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
          <h2>Welcome {this.props.currentUser}!</h2>
          }
        </center>
      </div>
    )
  } 
}

export default Profile