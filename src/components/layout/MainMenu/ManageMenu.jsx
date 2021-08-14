import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import { useLocation } from 'react-router';

const ManageMenu = () => {
  const { pathname } = useLocation();

  return (
    <nav id="manage_menu">
      <div className="px-3 d-flex align-items-center">
        <div style={{ flex: '0 0 10%', fontWeight: '500', fontSize: '24px' }}>Manage</div>
        <div className="d-flex justify-content-center" style={{ flex: '0 0 73%' }}>
          <Menu theme="dark" mode="horizontal" selectedKeys={[pathname]}>
            <Menu.Item key="/my-traces">
              <Link to="/my-traces">Traces</Link>
            </Menu.Item>
            <Menu.Item key="/my-donations">
              <Link to="/my-donations">Donations</Link>
            </Menu.Item>
            <Menu.Item key="/my-delegations">
              <Link to="/my-delegations">Delegations</Link>
            </Menu.Item>
            <Menu.Item key="/my-communities">
              <Link to="/my-communities">Communities</Link>
            </Menu.Item>
            <Menu.Item key="/my-campaigns">
              <Link to="/my-campaigns">Campaigns</Link>
            </Menu.Item>
          </Menu>
        </div>
        <div className="d-none d-sm-block" style={{ flex: '0 0 10%' }} />
      </div>
    </nav>
  );
};

export default ManageMenu;
