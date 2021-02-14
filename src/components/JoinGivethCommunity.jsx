import React, { useContext } from 'react';

import CommunityButton from './CommunityButton';
import { checkBalance } from '../lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import ErrorPopup from './ErrorPopup';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { history } from '../lib/helpers';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';

/**
 * The join Giveth community top-bar
 */
const JoinGivethCommunity = () => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isEnabled, balance },
    actions: { enableProvider },
  } = useContext(Web3Context);
  const { delegateWhitelistEnabled, projectOwnersWhitelistEnabled } = useContext(WhiteListContext);

  const userIsDelegator = currentUser.isDelegator || !delegateWhitelistEnabled;
  const userIsProjectOwner = currentUser.isProjectOwner || !projectOwnersWhitelistEnabled;

  const createDAC = () => {
    if (!userIsDelegator) {
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
    if (currentUser.address) {
      checkBalance(balance)
        .then(() => {
          history.push('/dacs/new');
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
          history.push('/signup');
        }
      });
    }
  };

  const createCampaign = () => {
    if (!userIsProjectOwner) {
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
    if (currentUser.address) {
      checkBalance(balance)
        .then(() => {
          history.push('/campaigns/new');
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
          history.push('/signup');
        }
      });
    }
  };

  return (
    <div id="join-giveth-community">
      <div className="vertical-align">
        <div className="text-center">
          <h3>Building the Future of Giving, with You.</h3>
          <CommunityButton className="btn btn-success" url="https://giveth.io/join">
            &nbsp;Join Giveth
          </CommunityButton>
          &nbsp;
          {userIsDelegator && (
            <button
              type="button"
              className="btn btn-info"
              onClick={() => {
                if (!isEnabled) {
                  enableProvider();
                } else {
                  createDAC(currentUser, balance);
                }
              }}
            >
              Create a Community
            </button>
          )}
          {userIsProjectOwner && (
            <button
              type="button"
              className="btn btn-info"
              onClick={() => {
                if (!isEnabled) {
                  enableProvider();
                } else {
                  createCampaign(currentUser, balance);
                }
              }}
            >
              Start a Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGivethCommunity;
