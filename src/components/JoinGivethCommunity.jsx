import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CommunityButton from './CommunityButton';
import User from '../models/User';
import BaseWallet from '../lib/blockchain/BaseWallet';
import { takeActionAfterWalletUnlock, checkWalletBalance, isInWhitelist } from '../lib/middleware';

/**
 * The join Giveth community top-bar
 */
class JoinGivethCommunity extends Component {
  constructor(props) {
    super(props);

    this.state = {
      canCreateCampaign: false,
      canCreateDAC: false,
    };

    this.createDAC = this.createDAC.bind(this);
    this.createCampaign = this.createCampaign.bind(this);
  }

  componentDidMount() {
    isInWhitelist(this.props.currentUser, React.whitelist.delegateWhitelist).then(() => {
      this.setState({ canCreateCampaign: true });
    });
    isInWhitelist(this.props.currentUser, React.whitelist.projectOwnerWhitelist).then(() => {
      this.setState({ canCreateDAC: true });
    });
  }

  createDAC() {
    isInWhitelist(this.props.currentUser, React.whitelist.delegateWhitelist)
      .then(() => {
        if (this.props.currentUser) {
          takeActionAfterWalletUnlock(this.props.wallet, () => {
            checkWalletBalance(this.props.wallet).then(() => {
              this.props.history.push('/dacs/new');
            });
          });
        } else {
          React.swal({
            title: "You're almost there...",
            content: React.swal.msg(
              <p>
                It&#8217;s great to see that you want to start a Decentralized Altruistic Community,
                or DAC. To get started, please sign up (or sign in) first.
              </p>,
            ),
            icon: 'info',
            buttons: ['Cancel', 'Sign up now!'],
          }).then(isConfirmed => {
            if (isConfirmed) this.props.history.push('/signup');
          });
        }
      })
      .catch(() => {
        React.swal({
          title: 'Sorry, Giveth is in beta...',
          content: React.swal.msg(
            <p>
              It&#8217;s great to see that you want to start a Decentralized Altruistic Community,
              or DAC! However, Giveth is still in alpha and we only allow a select group of people
              to start DACs<br />
              Please <strong>contact us on our Slack</strong>, or keep browsing
            </p>,
          ),
          icon: 'info',
          buttons: [false, 'Got it'],
        });
      });
  }

  createCampaign() {
    isInWhitelist(this.props.currentUser, React.whitelist.projectOwnerWhitelist)
      .then(() => {
        if (this.props.currentUser) {
          takeActionAfterWalletUnlock(this.props.wallet, () => {
            checkWalletBalance(this.props.wallet).then(() => {
              this.props.history.push('/campaigns/new');
            });
          });
        } else {
          React.swal({
            title: "You're almost there...",
            content: React.swal.msg(
              <p>
                It&#8217;s great to see that you want to start a campaign. To get started, please
                sign up (or sign in) first.
              </p>,
            ),
            icon: 'info',
            buttons: ['Cancel', 'Sign up now!'],
          }).then(isConfirmed => {
            if (isConfirmed) this.props.history.push('/signup');
          });
        }
      })
      .catch(() => {
        React.swal({
          title: 'Sorry, Giveth is in beta...',
          content: React.swal.msg(
            <p>
              It&#8217;s great to see that you want to start a campaign, however, Giveth is still in
              alpha and we only allow a select group of people to start campaigns<br />
              Please <strong>contact us on our Slack</strong>, or keep browsing
            </p>,
          ),
          icon: 'info',
          buttons: [false, 'Got it'],
        });
      });
  }

  render() {
    return (
      <div id="join-giveth-community">
        <div className="vertical-align">
          <center>
            <h3>Building the Future of Giving, with You.</h3>
            <CommunityButton className="btn btn-success" url="https://giveth.slack.com">
              &nbsp;Join Giveth
            </CommunityButton>
            &nbsp;
            {this.state.canCreateCampaign && (
              <button className="btn btn-info" onClick={() => this.createDAC()}>
                Create a Community
              </button>
            )}
            {this.state.canCreateDAC && (
              <button className="btn btn-info" onClick={() => this.createCampaign()}>
                Start a Campaign
              </button>
            )}
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
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(BaseWallet),
};

JoinGivethCommunity.defaultProps = {
  wallet: undefined,
  currentUser: undefined,
};
