import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Grid } from 'antd';

const { useBreakpoint } = Grid;

const LeftMenu = () => {
  const { lg } = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState();

  const { pathname } = useLocation();

  useEffect(() => {
    switch (true) {
      // TODO this is for backward compatibility
      case pathname === '/dacs':
      case pathname.startsWith('/dacs/'):
        setSelectedKeys('Communities');
        break;

      case pathname === '/communities':
      case pathname.startsWith('/community/'):
        setSelectedKeys('Communities');
        break;

      case pathname === '/campaigns':
      case pathname.startsWith('/campaign/'):
        setSelectedKeys('Campaigns');
        break;

      // TODO this is for backward compatiblity
      case pathname === '/milestones':
      case pathname.startsWith('/milestone/'):
        setSelectedKeys('Traces');
        break;
      case pathname === '/traces':
      case pathname.startsWith('/trace/'):
        setSelectedKeys('Traces');
        break;

      default:
        setSelectedKeys('');
    }
  }, [pathname]);

  return (
    <Menu mode={lg ? 'horizontal' : 'inline'} selectedKeys={[selectedKeys]}>
      <Menu.Item key="Communities">
        <Link to="/communities">Communities</Link>
      </Menu.Item>
      <Menu.Item key="Campaigns">
        <Link to="/campaigns">Campaigns</Link>
      </Menu.Item>
      <Menu.Item key="Traces">
        <Link to="/traces">Traces</Link>
      </Menu.Item>
    </Menu>
  );
};

export default React.memo(LeftMenu);
