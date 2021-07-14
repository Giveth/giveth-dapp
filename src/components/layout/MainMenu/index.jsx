import React from 'react';
import { useLocation } from 'react-router';

import MainMenu from './MainMenu';
import Banner from './Banner';
import ManageMenu from './ManageMenu';

const Header = () => {
  const { pathname } = useLocation();
  const profileArray = [
    '/my-traces',
    '/my-donations',
    '/my-delegations',
    '/my-communities',
    '/my-campaigns',
  ];
  return (
    <div id="header">
      <Banner />
      <MainMenu />
      {profileArray.includes(pathname) && <ManageMenu />}
    </div>
  );
};

export default Header;
