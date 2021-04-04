import React, { useContext, useState } from 'react';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import { Menu } from 'antd';

import { Context as UserContext } from '../../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../../../contextProviders/WhiteListProvider';
import { signUpSwal } from '../../../lib/helpers';
import MenuBarCreateButton from '../../MenuBarCreateButton';

const { SubMenu } = Menu;

const NewMainMenu = () => {
  const [selectedKeys, setSelectedKeys] = useState();

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

  const handleClick = e => {
    setSelectedKeys(e.key);
  };

  return (
    <div id="main_menu" className="sticky-top">
      <Menu
        onClick={handleClick}
        selectedKeys={[selectedKeys]}
        className="d-flex"
        mode="horizontal"
      >
        <Menu.Item key="logo" className="ml-4">
          <Link to="/">
            <img
              src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
              width="70px"
              alt="Giveth logo"
            />
          </Link>
        </Menu.Item>

        <Menu.Item key="Communities">
          <Link to="/dacs">Communities</Link>
        </Menu.Item>
        <Menu.Item key="Campaigns">
          <Link to="/campaigns">Campaigns</Link>
        </Menu.Item>
        <Menu.Item key="Milestones">
          <Link to="/milestones">Milestones</Link>
        </Menu.Item>

        <Menu.Item key="github" className="mx-auto">
          <a
            className="mx-auto order-3 order-lg-2 main-menu"
            href="https://www.github.com/Giveth/giveth-dapp/issues/new"
          >
            <div className="btn btn-dark btn-sm btn-report-issue">
              <i className="fa fa-github" />
              Report Issue
            </div>
          </a>
        </Menu.Item>

        <MenuBarCreateButtonWithRouter />

        {validProvider && currentUser.address && (
          <SubMenu key="Manage" title="Manage" className="ml-auto d-flex align-items-center">
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
          <Menu.Item key="EnableWeb3" className="ml-auto">
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
          <Menu.Item key="unlock" className="ml-auto">
            <small className="text-muted">Please unlock MetaMask</small>
          </Menu.Item>
        )}
        {!validProvider && (
          <Menu.Item key="SignUp" className="ml-auto">
            <button type="button" className="btn btn-outline-info btn-sm" onClick={signUpSwal}>
              Sign Up!
            </button>
          </Menu.Item>
        )}

        {currentUser.address && (
          <React.Fragment>
            {currentUser.avatar && (
              <Menu.Item key="Avatar">
                <Avatar className="menu-avatar" size={30} src={currentUser.avatar} round />
              </Menu.Item>
            )}
            <SubMenu
              className="d-flex align-items-center ml-0 mr-4"
              key="profile"
              title={currentUser.name ? currentUser.name : 'Hi, you!'}
            >
              <Menu.Item key="profile:1">
                <Link to="/profile">Profile</Link>
              </Menu.Item>
            </SubMenu>
          </React.Fragment>
        )}
      </Menu>
    </div>
  );
};

export default withRouter(NewMainMenu);

NewMainMenu.propTypes = {};

NewMainMenu.defaultProps = {};
