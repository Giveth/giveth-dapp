import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Grid } from 'antd';

const { useBreakpoint } = Grid;

const LeftMenu = () => {
  const [selectedKeys, setSelectedKeys] = useState();

  const { md } = useBreakpoint();

  const handleClick = e => {
    setSelectedKeys(e.key);
  };

  return (
    <Menu mode={md ? 'horizontal' : 'inline'} onClick={handleClick} selectedKeys={[selectedKeys]}>
      {/*<Menu.Item key="logo" className="ml-4">*/}
      {/*  <Link to="/">*/}
      {/*    <img*/}
      {/*      src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}*/}
      {/*      width="70px"*/}
      {/*      alt="Giveth logo"*/}
      {/*    />*/}
      {/*  </Link>*/}
      {/*</Menu.Item>*/}

      <Menu.Item key="Communities">
        <Link to="/dacs">Communities</Link>
      </Menu.Item>
      <Menu.Item key="Campaigns">
        <Link to="/campaigns">Campaigns</Link>
      </Menu.Item>
      <Menu.Item key="Milestones">
        <Link to="/milestones">Milestones</Link>
      </Menu.Item>
    </Menu>
  );
};

export default LeftMenu;
