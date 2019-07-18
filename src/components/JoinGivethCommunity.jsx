import React, { Component } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import CommunityButton from './CommunityButton';
import User from '../models/User';
import { checkBalance } from '../lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import ErrorPopup from './ErrorPopup';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';

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
    if (!this.props.isDelegate(this.props.currentUser)) {
      React.swal({
        title: 'Sorry, Giveth is in beta...',
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Decentralized Altruistic Community, or
            DAC! However, Giveth is still in alpha and we only allow a select group of people to
            start DACs
            <br />
            Please <strong>contact us on our Slack</strong>, or keep browsing
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
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
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
        if (isConfirmed) {
          this.props.history.push('/signup');
        }
      });
    }
  }

  createCampaign() {
    if (!this.props.isCampaignManager(this.props.currentUser)) {
      React.swal({
        title: 'Sorry, Giveth is in beta...',
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Campaign, however, Giveth is still in
            beta and we only allow a select group of people to start Campaigns
            <br />
            Please <strong>contact us on our Slack</strong>, or keep browsing
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
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Campaign. To get started, please sign
            up (or sign in) first.
          </p>,
        ),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then(isConfirmed => {
        if (isConfirmed) {
          this.props.history.push('/signup');
        }
      });
    }
  }

  render() {
    const { currentUser, isDelegate, isCampaignManager } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isEnabled }, actions: { enableProvider } }) => (
          <div id="join-giveth-community">
            <div className="vertical-align">
              <center>
                <h3>Building the Future of Giving, with You.</h3>
                <CommunityButton className="btn btn-success" url="https://giveth.io/join">
                  &nbsp;Join Giveth
                </CommunityButton>
                &nbsp;
                {isDelegate(currentUser) && (
                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={() => {
                      if (!isEnabled) {
                        enableProvider();
                      } else {
                        this.createDAC();
                      }
                    }}
                  >
                    Create a Community
                  </button>
                )}
                {isCampaignManager(currentUser) && (
                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={() => {
                      if (!isEnabled) {
                        enableProvider();
                      } else {
                        this.createCampaign();
                      }
                    }}
                  >
                    Start a Campaign
                  </button>
                )}
              </center>
            </div>
          </div>
        )}
      </Web3Consumer>
    );
  }
}

JoinGivethCommunity.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  balance: PropTypes.instanceOf(BigNumber),
  currentUser: PropTypes.instanceOf(User),
  isDelegate: PropTypes.func.isRequired,
  isCampaignManager: PropTypes.func.isRequired,
};

JoinGivethCommunity.defaultProps = {
  currentUser: undefined,
  balance: new BigNumber(0),
};

export default props => (
  <WhiteListConsumer>
    {({ actions: { isDelegate, isCampaignManager } }) => (
      <JoinGivethCommunity
        {...props}
        isDelegate={isDelegate}
        isCampaignManager={isCampaignManager}
      />
    )}
  </WhiteListConsumer>
);
