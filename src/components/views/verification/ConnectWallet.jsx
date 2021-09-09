import React, { useContext } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as UserContext } from '../../../contextProviders/UserProvider';

const ConnectWallet = ({ handleNextStep }) => {
  const {
    state: { validProvider },
    actions: { enableProvider, initOnBoard, switchWallet },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  return (
    <div className="p-5">
      <h2 className="py-5">
        Please connect your wallet with the same address you had provided before.
      </h2>

      <div className="mt-5">
        <Button className="connect-wallet-btn m-1" onClick={switchWallet}>
          SWITCH WALLET
        </Button>
        {!currentUser.address && (
          <Button
            className="connect-wallet-btn"
            onClick={validProvider ? enableProvider : initOnBoard}
          >
            CONNECT WALLET
          </Button>
        )}
        {currentUser.address && (
          <Button className="connect-wallet-btn m-1" onClick={handleNextStep}>
            NEXT
          </Button>
        )}
      </div>
    </div>
  );
};

ConnectWallet.propTypes = {
  handleNextStep: PropTypes.func.isRequired,
};

export default ConnectWallet;
