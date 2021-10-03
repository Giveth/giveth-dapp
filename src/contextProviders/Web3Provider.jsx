import React, { createContext, Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Onboard from 'bnc-onboard';
import Web3 from 'web3';
import config from '../configuration';
import NetworkWarningModal from '../components/NetworkWarningModal';

const Context = createContext({});
const { Provider, Consumer } = Context;

const wallets = [
  { walletName: 'metamask', preferred: true },
  { walletName: 'torus', preferred: true },
];

const Web3Provider = props => {
  const [validProvider, setValidProvider] = useState(false);
  const [network, setNetwork] = useState({});
  const [web3, setWeb3] = useState();
  const [account, setAccount] = useState();
  const [balance, setBalance] = useState();
  const [onboard, setOnboard] = useState({});
  const [showForeignNetWarning, setShowForeignNetWarning] = useState(false);

  const setNetworkState = networkId => {
    const isHomeNetwork = networkId === config.homeNetworkId;
    const isForeignNetwork = networkId === config.foreignNetworkId;
    setNetwork({ networkId, isHomeNetwork, isForeignNetwork });
  };

  const initOnBoard = () => {
    const _onboard = Onboard({
      dappId: config.onboardDappId,
      networkId: config.foreignNetworkId,
      subscriptions: {
        wallet: wallet => {
          window.localStorage.setItem('selectedWallet', wallet.name);
          const _web3 = new Web3(wallet.provider);
          _web3[wallet.name] = true;
          setValidProvider(!!wallet.provider);
          setWeb3(_web3);
        },
        network: _network => setNetworkState(_network),
        address: _address => setAccount(_address),
        balance: _balance => setBalance(new BigNumber(_balance)),
      },
      walletSelect: {
        wallets,
      },
    });

    const previouslySelectedWallet = window.localStorage.getItem('selectedWallet');
    if (previouslySelectedWallet) {
      _onboard
        .walletSelect(previouslySelectedWallet)
        .then(selected => selected && _onboard.walletCheck().then());
    } else {
      _onboard.walletSelect().then(selected => selected && _onboard.walletCheck().then());
    }
    setOnboard(_onboard);
  };

  const switchWallet = () => {
    onboard.walletSelect().then(selected => selected && onboard.walletCheck().then());
  };

  const enableProvider = () => {
    onboard.walletCheck().then();
  };

  const { networkId, isForeignNetwork, isHomeNetwork } = network;
  const isMetaMask = web3 && web3.MetaMask;
  const isEnabled = !!web3 && !!account && !!balance && !!networkId;

  const switchNetwork = _chainId => {
    if (isMetaMask) {
      let chainId = config.foreignNetworkChainId;
      if (isForeignNetwork) chainId = config.homeNetworkChainId;
      if (typeof _chainId === 'string') chainId = _chainId;
      window.ethereum
        .request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        })
        .then(() => {
          if (showForeignNetWarning) setShowForeignNetWarning(false);
        })
        .catch();
    }
  };

  useEffect(() => {
    initOnBoard();
  }, []);

  useEffect(() => {
    if (networkId) onboard.config({ networkId });
  }, [networkId]);

  return (
    <Fragment>
      <NetworkWarningModal
        show={showForeignNetWarning && !isForeignNetwork}
        closeModal={() => setShowForeignNetWarning(false)}
        switchNetwork={chainId => switchNetwork(chainId)}
        web3={web3}
      />
      <Provider
        value={{
          state: {
            account,
            balance,
            validProvider,
            isHomeNetwork,
            isForeignNetwork,
            isEnabled,
            web3,
          },
          actions: {
            switchWallet,
            enableProvider,
            initOnBoard,
            displayForeignNetRequiredWarning: () => setShowForeignNetWarning(true),
            switchNetwork: chainId => switchNetwork(chainId),
          },
        }}
      >
        {props.children}
      </Provider>
    </Fragment>
  );
};

Web3Provider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export { Consumer, Context };
export default Web3Provider;
