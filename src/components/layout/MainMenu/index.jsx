import React from 'react';

import MainMenu from './MainMenu';
import Banner from './Banner';

const Header = () => {
  return (
    <div id="header">
      <Banner />
      <MainMenu />
    </div>
  );
};

export default Header;
