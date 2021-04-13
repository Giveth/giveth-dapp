import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer } from 'antd';
import { MenuFoldOutlined } from '@ant-design/icons';

import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

const ReportIssue = () => {
  return (
    <div className="btn-report-issue">
      <a
        className="btn btn-dark btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.github.com/Giveth/giveth-dapp/issues/new"
      >
        <i className="fa fa-github" />
        Report Issue
      </a>
    </div>
  );
};

const MainMenu = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  return (
    <nav id="main_menu">
      <div className="d-flex align-items-center justify-content-between px-3">
        <div className="p-3">
          <Link to="/">
            <img
              src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
              width="70px"
              alt="Giveth logo"
            />
          </Link>
        </div>
        <div className="d-none d-lg-block">
          <ReportIssue />
        </div>
        <div className="w-100 d-none d-lg-flex align-items-stretch justify-content-between">
          <LeftMenu />
          <RightMenu />
        </div>
        <div>
          <MenuFoldOutlined
            style={{ fontSize: '24px' }}
            className="d-lg-none"
            onClick={() => setShowMobileMenu(true)}
          />
          <Drawer
            title={<ReportIssue />}
            placement="right"
            closable={false}
            onClose={() => setShowMobileMenu(false)}
            visible={showMobileMenu}
            className="text-center"
          >
            <LeftMenu />
            <RightMenu />
          </Drawer>
        </div>
      </div>
    </nav>
  );
};

export default MainMenu;
