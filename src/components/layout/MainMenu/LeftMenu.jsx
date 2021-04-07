import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Grid } from 'antd';

const { useBreakpoint } = Grid;

const LeftMenu = () => {
  const [selectedKeys, setSelectedKeys] = useState();

  const { lg } = useBreakpoint();

  const handleClick = e => {
    setSelectedKeys(e.key);
  };

  return (
    <Menu mode={lg ? 'horizontal' : 'inline'} onClick={handleClick} selectedKeys={[selectedKeys]}>
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
