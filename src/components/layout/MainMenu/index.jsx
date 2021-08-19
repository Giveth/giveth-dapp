import React from 'react';
import { useLocation } from 'react-router';

import MainMenu from './MainMenu';
import Banner from './Banner';
import ManageMenu from './ManageMenu';

const Header = () => {
  const { pathname } = useLocation();

  const isVerification = pathname.startsWith('/verification');

  const profileArray = [
    '/my-traces',
    '/my-donations',
    '/my-delegations',
    '/my-communities',
    '/my-campaigns',
  ];
  return (
    <div>
      {!isVerification && (
        <div id="header">
          <Banner />
          <MainMenu />
          {profileArray.includes(pathname) && <ManageMenu />}
        </div>
      )}
    </div>
  );
};

export default Header;
