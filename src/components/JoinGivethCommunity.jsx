import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CommunityButton from './CommunityButton';
import currentUserModel from '../models/currentUserModel';
import { takeActionAfterWalletUnlock, checkWalletBalance } from '../lib/middleware';
import GivethWallet from '../lib/blockchain/GivethWallet';

/**
 * The join Giveth community top-bar
 */
class JoinGivethCommunity extends Component {
  constructor(props) {
    super(props);

    this.createDAC = this.createDAC.bind(this);
    this.createCampaign = this.createCampaign.bind(this);
  }
  createDAC() {
    if (this.props.currentUser) {
      takeActionAfterWalletUnlock(this.props.wallet, () => {
        checkWalletBalance(this.props.wallet).then(() => { this.props.history.push('/dacs/new'); });
      });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(<p>
            Great to see that you want to start a Decentralized Altruistic Community, or DAC.
            To get started, please sign up (or sign in) first.
                                </p>),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then((isConfirmed) => {
        if (isConfirmed) this.props.history.push('/signup');
      });
    }
  }

  createCampaign() {
    if (this.props.currentUser) {
      takeActionAfterWalletUnlock(this.props.wallet, () => {
        checkWalletBalance(this.props.wallet).then(() => { this.props.history.push('/campaigns/new'); });
      });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(<p>
            Great to see that you want to start a campaign.
            To get started, please sign up (or sign in) first.
                                </p>),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then((isConfirmed) => {
        if (isConfirmed) this.props.history.push('/signup');
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

            <button
              className="btn btn-info"
              onClick={() => this.createDAC()}
            >Create a Community
            </button>
            <button
              className="btn btn-info"
              onClick={() => this.createCampaign()}
            >Start a Campaign
            </button>
          </center>
        </div>
      </div>
    );
  }
}

export default JoinGivethCommunity;

JoinGivethCommunity.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: currentUserModel,
  wallet: PropTypes.instanceOf(GivethWallet),
};

JoinGivethCommunity.defaultProps = {
  wallet: undefined,
  currentUser: undefined,
};
