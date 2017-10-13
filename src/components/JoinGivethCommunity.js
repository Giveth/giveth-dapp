import React, { Component } from 'react'
import PropTypes from 'prop-types';

import CommunityButton from './CommunityButton'

import currentUserModel from '../models/currentUserModel'

import { checkWalletBalance } from '../lib/middleware'

/**
  The join Giveth community top-bar
**/

class JoinGivethCommunity extends Component {

  createDAC(){
    if(this.props.currentUser) {
      checkWalletBalance(this.props.wallet).then(() => { this.props.history.push('/dacs/new')})
    } else {
      React.swal({
        title: "You're almost there...", 
        content: React.swal.msg(
          <p>
            Great to see that you want to start a Decentralized Altruistic Community, or DAC.
            To get started, please sign up (or sign in) first.
          </p>
        ),
        icon: 'info',
        buttons: ["Cancel", "Sign up now!"]
      }).then((isConfirmed) => {
        if(isConfirmed) this.props.history.push('/signup')
      });     
    }  
  }

  createCampaign(){
    if(this.props.currentUser) {
      checkWalletBalance(this.props.wallet).then(() => { this.props.history.push('/dacs/new')})
    } else {    
      React.swal({
        title: "You're almost there...", 
        content: React.swal.msg(
          <p>
            Great to see that you want to start a campaign.
            To get started, please sign up (or sign in) first.
          </p>
        ),
        icon: 'info',
        buttons: ["Cancel", "Sign up now!"]
      }).then((isConfirmed) => {
        if(isConfirmed) this.props.history.push('/signup')
      });  
    }    
  }

  render() {
    return (
      <div id="join-giveth-community">
        <div className="vertical-align">
          <center>
            <h3>Together we will save the world!</h3>

            <CommunityButton className="btn btn-success" url="https://giveth.slack.com">
              &nbsp;Join Giveth
            </CommunityButton>
            
            &nbsp;

            <a className="btn btn-info" onClick={()=>this.createDAC()}>Create a Community</a>
            <a className="btn btn-info" onClick={()=>this.createCampaign()}>Start a Campaign</a>
          </center>
        </div>
      </div>
    )
  } 
}

export default JoinGivethCommunity

JoinGivethCommunity.propTypes = {
  currentUser: currentUserModel,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    lock: PropTypes.func.isRequired,
  }).isRequired,
  history: PropTypes.object.isRequired
}