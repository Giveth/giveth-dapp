import React, { useState } from 'react';
import { Drawer, Button } from 'antd';

import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';
import IssueBtn from './IssueBtn';

const NewMainMenu = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div id="main_menu" className="sticky-top">
      <nav className="menuBar">
        {/*<div className="logo">*/}
        {/*  <a href="">logo</a>*/}
        {/*</div>*/}
        <div className="menuCon">
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
            title="Basic Drawer"
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
      {/*<div className="d-flex">*/}
      {/*  <LeftMenu />*/}
      {/*  <IssueBtn />*/}
      {/*  <RightMenu />*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*  <Button className="barsMenu" type="primary" onClick={() => setShowMobileMenu(true)}>*/}
      {/*    <span className="barsBtn" />*/}
      {/*  </Button>*/}
      {/*  <Drawer*/}
      {/*    // title="Basic Drawer"*/}
      {/*    placement="right"*/}
      {/*    closable={false}*/}
      {/*    onClose={() => setShowMobileMenu(false)}*/}
      {/*    visible={showMobileMenu}*/}
      {/*  >*/}
      {/*    <LeftMenu />*/}
      {/*    <RightMenu />*/}
      {/*  </Drawer>*/}
      {/*</div>*/}
    </div>
  );
};

export default NewMainMenu;

NewMainMenu.propTypes = {};

NewMainMenu.defaultProps = {};
