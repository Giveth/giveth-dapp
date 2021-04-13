import React, { useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { Menu, Grid } from 'antd';

const { useBreakpoint } = Grid;

const LeftMenu = () => {
  const { lg } = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState();

  const isDac = useRouteMatch('/dac/:slug') || useRouteMatch('/dacs');
  const isCamp = useRouteMatch('/campaign/:slug') || useRouteMatch('/campaigns');
  const isMilestone = useRouteMatch('/milestone/:slug') || useRouteMatch('/milestones');

  let selectedKey;
  if (isDac) selectedKey = 'Communities';
  else if (isCamp) selectedKey = 'Campaigns';
  else if (isMilestone) selectedKey = 'Milestones';
  else selectedKey = '';

  useEffect(() => {
    setSelectedKeys(selectedKey);
  }, [selectedKey]);

  return (
    <Menu mode={lg ? 'horizontal' : 'inline'} selectedKeys={[selectedKeys]}>
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
