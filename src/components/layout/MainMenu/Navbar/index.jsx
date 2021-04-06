import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, Button } from 'antd';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  return (
    <nav className="menuBar d-flex align-items-center" id="main_menu">
      <div className="p-3">
        <Link to="/">
          <img
            src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
            width="70px"
            alt="Giveth logo"
          />
        </Link>
      </div>
      <a href="https://www.github.com/Giveth/giveth-dapp/issues/new" className="btn-report-issue">
        <div className="btn btn-dark btn-sm">
          <i className="fa fa-github" />
          Report Issue
        </div>
      </a>
      <div className="menuCon w-100 d-flex align-items-stretch justify-content-between">
        <div className="leftMenu">
          <LeftMenu />
        </div>
        <div className="rightMenu">
          <RightMenu />
        </div>
        <Button className="barsMenu" type="primary" onClick={() => setShowMobileMenu(true)}>
          <span className="barsBtn" />
        </Button>
        <Drawer
          // title="Basic Drawer"
          placement="right"
          closable={false}
          onClose={() => setShowMobileMenu(false)}
          visible={showMobileMenu}
        >
          <LeftMenu />
          <RightMenu />
        </Drawer>
      </div>
    </nav>
  );
};

export default Navbar;
