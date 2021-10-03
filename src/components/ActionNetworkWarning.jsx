import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import Web3 from 'web3';
import config from '../configuration';

/**
 * It is used to show in modals when user wants to take an action while connected to wrong network.
 */

function ActionNetworkWarning(props) {
  const { incorrectNetwork, networkName, switchNetwork, web3, isInline } = props;
  const isMetaMask = web3 && web3.MetaMask;

  const switchNetworkBtn = () =>
    // Just MetaMask supports changing network
    isMetaMask && (
      <div className="my-2">
        <Button type="primary" ghost className="ml-4 rounded" onClick={switchNetwork}>
          Switch Network
        </Button>
      </div>
    );

  return (
    incorrectNetwork && (
      <div className={isInline ? '' : 'text-center'}>
        <div className="alert alert-warning d-flex flex-wrap align-items-center">
          <div className="d-flex align-items-center">
            <i className="fa fa-exclamation-triangle mr-3" />
            <div>
              To enable all actions, please connect your wallet to <strong>{networkName}</strong>{' '}
              network.
            </div>
          </div>
          {isInline && switchNetworkBtn()}
        </div>
        {!isInline && switchNetworkBtn()}
      </div>
    )
  );
}

ActionNetworkWarning.propTypes = {
  incorrectNetwork: PropTypes.bool.isRequired,
  networkName: PropTypes.string,
  switchNetwork: PropTypes.func,
  web3: PropTypes.instanceOf(Web3),
  isInline: PropTypes.bool,
};

ActionNetworkWarning.defaultProps = {
  switchNetwork: () => {},
  web3: undefined,
  isInline: false,
  networkName: config.foreignNetworkName,
};

export default ActionNetworkWarning;
