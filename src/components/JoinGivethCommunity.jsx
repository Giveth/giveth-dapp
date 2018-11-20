import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';

import CommunityButton from './CommunityButton';
import User from '../models/User';
import { isInWhitelist, checkBalance } from '../lib/middleware';

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
    if (!isInWhitelist(this.props.currentUser, React.whitelist.delegateWhitelist)) {
      React.swal({
        title: 'Sorry, Giveth is in beta...',
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Decentralized Altruistic Community, or
            DAC! However, Giveth is still in alpha and we only allow a select group of people to
            start DACs
            <br />
            Please <strong>contact us on our Slack</strong>
            , or keep browsing
          </p>,
        ),
        icon: 'info',
        buttons: [false, 'Got it'],
      });
      return;
    }
    if (this.props.currentUser) {
      checkBalance(this.props.balance)
        .then(() => {
          this.props.history.push('/dacs/new');
        })
        .catch(err => {
          if (err === 'noBalance') {
            // handle no balance error
          }
        });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Decentralized Altruistic Community, or
            DAC. To get started, please sign up (or sign in) first.
          </p>,
        ),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then(isConfirmed => {
        if (isConfirmed) this.props.history.push('/signup');
      });
    }
  }

  createCampaign() {
    if (!isInWhitelist(this.props.currentUser, React.whitelist.projectOwnerWhitelist)) {
      React.swal({
        title: 'Sorry, Giveth is in beta...',
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a campaign, however, Giveth is still in
            beta and we only allow a select group of people to start campaigns
            <br />
            Please <strong>contact us on our Slack</strong>
            , or keep browsing
          </p>,
        ),
        icon: 'info',
        buttons: [false, 'Got it'],
      });
      return;
    }
    if (this.props.currentUser) {
      checkBalance(this.props.balance)
        .then(() => {
          this.props.history.push('/campaigns/new');
        })
        .catch(err => {
          if (err === 'noBalance') {
            // handle no balance error
          }
        });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a campaign. To get started, please sign
            up (or sign in) first.
          </p>,
        ),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then(isConfirmed => {
        if (isConfirmed) this.props.history.push('/signup');
      });
    }
  }

  render() {
    const { currentUser } = this.props;
    const canCreateDAC = isInWhitelist(currentUser, React.whitelist.delegateWhitelist);
    const canCreateCampaign = isInWhitelist(currentUser, React.whitelist.projectOwnerWhitelist);

    return (
      <div id="join-giveth-community">
        <div className="vertical-align">
          <center>
            <h3>Building the Future of Giving, with You.</h3>
            <CommunityButton className="btn btn-success" url="https://giveth.io/join">
              &nbsp;Join Giveth
            </CommunityButton>
            &nbsp;
            {canCreateDAC && (
              <button type="button" className="btn btn-info" onClick={() => this.createDAC()}>
                Create a Community
              </button>
            )}
            {canCreateCampaign && (
              <button type="button" className="btn btn-info" onClick={() => this.createCampaign()}>
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
  balance: PropTypes.objectOf(utils.BN).isRequired,
  currentUser: PropTypes.instanceOf(User),
};

JoinGivethCommunity.defaultProps = {
  currentUser: undefined,
};
