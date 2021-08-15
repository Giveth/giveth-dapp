import React, { useContext } from 'react';

import CommunityButton from './CommunityButton';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
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
  const {
    state: { delegateWhitelistEnabled, projectOwnersWhitelistEnabled },
  } = useContext(WhiteListContext);

  const userIsDelegator = currentUser.isDelegator || !delegateWhitelistEnabled;
  const userIsProjectOwner = currentUser.isProjectOwner || !projectOwnersWhitelistEnabled;

  const createCommunity = () => {
    history.push('/communities/new');
  };

  const createCampaign = () => {
    history.push('/campaigns/new');
  };

  return (
    <div id="join-giveth-community">
      <div className="vertical-align">
        <div className="text-center">
          <h3>Building the Future of Giving, with You.</h3>
          <CommunityButton className="btn btn-success" url="https://giveth.io/join">
            Join Giveth
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
                  createCommunity(currentUser, balance);
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
