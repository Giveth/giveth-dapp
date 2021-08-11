import { Button } from 'antd';
import React, { useContext } from 'react';
import Logo from '../../../assets/logo-purple.svg';
import { shortenAddress } from '../../../lib/helpers';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as UserContext } from '../../../contextProviders/UserProvider';

const Header = () => {
  const {
    state: { validProvider },
    actions: { enableProvider, initOnBoard, switchWallet },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const handleOnClick = () => {
    if (currentUser.address) switchWallet();
    else if (validProvider) enableProvider();
    else initOnBoard();
  };

  return (
    <div className="verification-header d-flex justify-content-between align-items-center mx-sm-5 mx-2">
      <img height={35} src={Logo} alt="Logo" />
      <Button ghost onClick={handleOnClick}>
        {currentUser.address ? shortenAddress(currentUser.address) : 'CONNECT WALLET'}
      </Button>
    </div>
  );
};

export default Header;
