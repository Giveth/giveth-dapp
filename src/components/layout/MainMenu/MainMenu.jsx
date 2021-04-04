import React, { useContext, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import { Menu, Button, Layout } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import './index.css';

import { Context as UserContext } from '../../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../../../contextProviders/WhiteListProvider';
import { history, signUpSwal } from '../../../lib/helpers';
import MenuBarCreateButton from '../../MenuBarCreateButton';

const { SubMenu } = Menu;
const { Header, Sider, Content } = Layout;

// Broken rule that can not find the correct id tag
/* eslint jsx-a11y/aria-proptypes: 0 */
/**
 * The main top menu
 */
const NewMainMenu = () => {
  const [selectedKeys, setSelectedKeys] = useState('mail');
  const [toggleCollapsed, setToggleCollapsed] = useState(true);

  // when route changes, close the menu

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
    <div>
      <Button
        type="primary"
        onClick={() => setToggleCollapsed(!toggleCollapsed)}
        style={{ marginBottom: 16 }}
      >
        {React.createElement(toggleCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
      </Button>
      <Menu
        onClick={handleClick}
        selectedKeys={[selectedKeys]}
        mode="inline"
        inlineCollapsed={toggleCollapsed}
      >
        <Link to="/">
          <img
            src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
            width="70px"
            alt="Giveth logo"
          />
        </Link>

        <Menu.Item key="mail">
          <Link to="/dacs">
            Communities
          </Link>
        </Menu.Item>
        <Menu.Item key="app">
          <Link to="/campaigns">
            Campaigns
          </Link>
        </Menu.Item>
        <Menu.Item key="alipay">
          <Link to="/milestones">
            Milestones
          </Link>
        </Menu.Item>

        <a
          className="mx-auto order-3 order-lg-2 main-menu"
          href="https://www.github.com/Giveth/giveth-dapp/issues/new"
        >
          <button className="btn btn-dark btn-sm btn-report-issue">
            <i className="fa fa-github" />
            Report Issue
          </button>
        </a>

        {validProvider && currentUser.address && (
          <SubMenu key="Manage" title="Manage">
            <Menu.Item key="setting:1">
              <Link to="/my-milestones">My Milestones</Link>
            </Menu.Item>
            <Menu.Item key="setting:2">
              <Link to="/donations">My Donations</Link>
            </Menu.Item>
            <Menu.Item key="setting:3">
              <Link to="/delegations">My Delegations</Link>
            </Menu.Item>
            {(userIsDelegator || userIsReviewer) && (
              <Menu.Item key="setting:4">
                <Link to="/my-dacs">My Communities</Link>
              </Menu.Item>
            )}
            {(userIsCampaignManager || userIsReviewer) && (
              <Menu.Item key="setting:5">
                <Link to="/my-campaigns">My Campaigns</Link>
              </Menu.Item>
            )}
          </SubMenu>
        )}

        {validProvider && !failedToLoad && !isEnabled && !currentUser.address && (
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            onClick={() => enableProvider()}
          >
            Enable Web3
          </button>
        )}
        {validProvider && !failedToLoad && isEnabled && !currentUser.address && (
          <small className="text-muted">Please unlock MetaMask</small>
        )}
        {!validProvider && (
          <button type="button" className="btn btn-outline-info btn-sm" onClick={signUpSwal}>
            Sign Up!
          </button>
        )}

        {currentUser.address && (
          <React.Fragment>
            {currentUser.avatar && (
              <Avatar className="menu-avatar" size={30} src={currentUser.avatar} round />
            )}
            <SubMenu key="profile" title={currentUser.name ? currentUser.name : 'Hi, you!'}>
              <Menu.Item key="profile:1">
                <Link to="/profile">Profile</Link>
              </Menu.Item>
            </SubMenu>
          </React.Fragment>
        )}
      </Menu>

      <Layout>
        <Sider
          trigger={null}
          collapsed={toggleCollapsed}
          collapsedWidth={0}
          breakpoint="md"
        >
          <div className="logo" />
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<UserOutlined />}>
              nav 1
            </Menu.Item>
            <Menu.Item key="2" icon={<VideoCameraOutlined />}>
              nav 2
            </Menu.Item>
            <Menu.Item key="3" icon={<UploadOutlined />}>
              nav 3
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }}>
            {React.createElement(toggleCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setToggleCollapsed(!toggleCollapsed),
            })}
          </Header>
          <Content
            className="site-layout-background"
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
            }}
          >

            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>
            <p>Content</p>

          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default withRouter(NewMainMenu);

NewMainMenu.propTypes = {};

NewMainMenu.defaultProps = {};
