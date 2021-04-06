import React, { useContext, useState } from 'react';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';
import { Menu, Grid } from 'antd';

import { Context as UserContext } from '../../../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../../../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../../../../contextProviders/WhiteListProvider';
import { signUpSwal } from '../../../../lib/helpers';
import MenuBarCreateButton from '../../../MenuBarCreateButton';

const { SubMenu } = Menu;
const { useBreakpoint } = Grid;

const RightMenu = () => {
  const { md } = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState('');

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    state: { isEnabled, validProvider, failedToLoad },
    actions: { enableProvider },
  } = useContext(Web3Context);

  const {
    state: { reviewerWhitelistEnabled, delegateWhitelistEnabled, projectOwnersWhitelistEnabled },
  } = useContext(WhiteListContext);

  const userIsDelegator = currentUser.isDelegator || !delegateWhitelistEnabled;
  const userIsCampaignManager = currentUser.isProjectOwner || !projectOwnersWhitelistEnabled;
  const userIsReviewer = currentUser.isReviewer || !reviewerWhitelistEnabled;

  const handleClick = e => {
    setSelectedKeys(e.key);
  };

  return (
    <Menu onClick={handleClick} selectedKeys={[selectedKeys]} mode={md ? 'horizontal' : 'inline'}>
      <MenuBarCreateButton />

      {validProvider && currentUser.address && (
        <SubMenu key="Manage" title="Manage">
          <Menu.Item key="Manage:1">
            <Link to="/my-milestones">My Milestones</Link>
          </Menu.Item>
          <Menu.Item key="Manage:2">
            <Link to="/donations">My Donations</Link>
          </Menu.Item>
          <Menu.Item key="Manage:3">
            <Link to="/delegations">My Delegations</Link>
          </Menu.Item>
          {(userIsDelegator || userIsReviewer) && (
            <Menu.Item key="Manage:4">
              <Link to="/my-dacs">My Communities</Link>
            </Menu.Item>
          )}
          {(userIsCampaignManager || userIsReviewer) && (
            <Menu.Item key="Manage:5">
              <Link to="/my-campaigns">My Campaigns</Link>
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {validProvider && !failedToLoad && !isEnabled && !currentUser.address && (
        <Menu.Item key="EnableWeb3">
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            onClick={() => enableProvider()}
          >
            Enable Web3
          </button>
        </Menu.Item>
      )}
      {validProvider && !failedToLoad && isEnabled && !currentUser.address && (
        <Menu.Item key="unlock">
          <small className="text-muted">Please unlock MetaMask</small>
        </Menu.Item>
      )}
      {!validProvider && (
        <Menu.Item key="SignUp">
          <button type="button" className="btn btn-outline-info btn-sm" onClick={signUpSwal}>
            Sign Up!
          </button>
        </Menu.Item>
      )}

      {currentUser.address && (
        <React.Fragment>
          <SubMenu
            key="profile"
            title={
              <React.Fragment>
                {currentUser.avatar && (
                  <Avatar className="mr-2" size={30} src={currentUser.avatar} round />
                )}
                {currentUser.name ? currentUser.name : 'Hi, you!'}
              </React.Fragment>
            }
          >
            <Menu.Item key="profile:1">
              <Link to="/profile">Profile</Link>
            </Menu.Item>
          </SubMenu>
        </React.Fragment>
      )}
    </Menu>
  );
};

export default RightMenu;
