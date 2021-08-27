import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import MainMenu from './MainMenu';
import Banner from './Banner';
import ManageMenu from './ManageMenu';

const Header = () => {
  const [gotTxLimit, setGotTxLimit] = useState(true);

  const { pathname } = useLocation();

  const setNotify = () => {
    setGotTxLimit(true);
    localStorage.setItem('gotTxLimit', 'true');
  };

  useEffect(() => {
    const NotifyState = localStorage.getItem('gotTxLimit') === 'true';
    setGotTxLimit(NotifyState);
  }, []);

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
          {!gotTxLimit && <Banner setNotify={setNotify} />}
          <MainMenu />
          {profileArray.includes(pathname) && <ManageMenu />}
        </div>
      )}
    </div>
  );
};

export default Header;
