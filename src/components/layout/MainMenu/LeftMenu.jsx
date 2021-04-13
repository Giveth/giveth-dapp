import React, { useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { Menu, Grid } from 'antd';

const { useBreakpoint } = Grid;

const LeftMenu = () => {
  const { lg } = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState();

  const isDac1 = useRouteMatch('/dac/:slug');
  const isDac2 = useRouteMatch('/dacs');
  const isCamp1 = useRouteMatch('/campaign/:slug');
  const isCamp2 = useRouteMatch('/campaigns');
  const isMilestone1 = useRouteMatch('/milestone/:slug');
  const isMilestone2 = useRouteMatch('/milestones');

  let selectedKey;
  if (isDac1 || isDac2) selectedKey = 'Communities';
  else if (isCamp1 || isCamp2) selectedKey = 'Campaigns';
  else if (isMilestone1 || isMilestone2) selectedKey = 'Milestones';
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
