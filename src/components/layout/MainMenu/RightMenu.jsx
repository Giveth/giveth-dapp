import React, { useContext, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import { Link, useLocation } from 'react-router-dom';
import { withRouter } from 'react-router';
import { Menu, Grid } from 'antd';

import { Context as UserContext } from '../../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../../../contextProviders/WhiteListProvider';
import { signUpSwal } from '../../../lib/helpers';
import MenuBarCreateButton from '../../MenuBarCreateButton';
import TotalGasPaid from '../../views/TotalGasPaid';

const { SubMenu } = Menu;
const { useBreakpoint } = Grid;

const RightMenu = () => {
  const { lg } = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState('');

  const MenuBarCreateButtonWithRouter = withRouter(MenuBarCreateButton);

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

  const { pathname } = useLocation();

  useEffect(() => {
    const userAddress = currentUser._address && currentUser._address.toLowerCase();
    switch (true) {
      case pathname === '/profile':
      case pathname.toLowerCase() === `/profile/${userAddress}`:
        setSelectedKeys('profile:1');
        break;

      case pathname === '/my-traces':
        setSelectedKeys('profile:2');
        break;

      case pathname === '/donations':
        setSelectedKeys('profile:3');
        break;

      case pathname === '/delegations':
        setSelectedKeys('profile:4');
        break;

      case pathname === '/my-communities':
        setSelectedKeys('profile:5');
        break;

      case pathname === '/my-campaigns':
        setSelectedKeys('profile:6');
        break;

      default:
        setSelectedKeys('');
    }
  }, [pathname, currentUser]);

  return (
    <Menu selectedKeys={[selectedKeys]} mode={lg ? 'horizontal' : 'inline'}>
      <Menu.Item key="CreateButton">
        <MenuBarCreateButtonWithRouter />
      </Menu.Item>

      {validProvider && currentUser.address && (
        <SubMenu
          key="profile"
          title={
            <React.Fragment>
              {currentUser.avatar && (
                <Avatar className="mr-2" size={30} src={currentUser.avatar} round />
              )}
              <span>{currentUser.name ? currentUser.name : 'Hi, you!'}</span>
            </React.Fragment>
          }
        >
          <Menu.Item
            key="profile:1"
            className="mt-0"
            style={{
              borderBottom: '1px solid #EAEBEE',
              paddingBottom: '44px',
              paddingTop: '6px',
            }}
          >
            <Link to="/profile">Profile</Link>
          </Menu.Item>
          <Menu.Item key="profile:2">
            <Link to="/my-traces">My Traces</Link>
          </Menu.Item>
          <Menu.Item key="profile:3">
            <Link to="/donations">My Donations</Link>
          </Menu.Item>
          <Menu.Item key="profile:4">
            <Link to="/delegations">My Delegations</Link>
          </Menu.Item>
          {(userIsDelegator || userIsReviewer) && (
            <Menu.Item key="profile:5">
              <Link to="/my-communities">My Communities</Link>
            </Menu.Item>
          )}
          {(userIsCampaignManager || userIsReviewer) && (
            <Menu.Item key="profile:6">
              <Link to="/my-campaigns">My Campaigns</Link>
            </Menu.Item>
          )}
          <Menu.Item className="p-0 mb-0" style={{ height: '70px' }}>
            <TotalGasPaid gasPaidUsdValue={currentUser.gasPaidUsdValue} className="menuGasPaid" />
          </Menu.Item>
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
    </Menu>
  );
};

export default withRouter(RightMenu);
