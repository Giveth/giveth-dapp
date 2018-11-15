import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';

import getWeb3 from '../lib/blockchain/getWeb3';
import getNetwork from '../lib/blockchain/getNetwork';
import config from '../configuration';

const { toBN } = utils;
const { tokenAddresses } = config;

const POLL_DELAY_ACCOUNT = 1000;
const POLL_DELAY_NETWORK = 2000;
const POLL_DELAY_TOKENS = 2000;

const Context = createContext();
const { Provider, Consumer } = Context;

const pollEvery = (fn, delay) => {
  let timer = -1;
  let stop = false;
  const poll = async (request, onResult) => {
    const result = await request();
    if (!stop) {
      onResult(result);
      timer = setTimeout(poll.bind(null, request, onResult), delay);
    }
  };
  return (...params) => {
    const { request, onResult } = fn(...params);
    poll(request, onResult);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  };
};

const getAccount = async web3 => {
  try {
    const addrs = await web3.eth.getAccounts();
    if (addrs.length > 0) return addrs[0];
  } catch (e) {
    // ignore
  }
  return undefined;
};

const defaultTokenBalances = () =>
  Object.keys(tokenAddresses).reduce((accumulator, addr) => {
    accumulator[addr] = toBN(0);
    return accumulator;
  }, {});

const getTokenBalance = async (contract, account) => {
  let balance = toBN(0);
  try {
    balance = await contract.balanceOf(account);
  } catch (e) {
    // ignore
  }

  return {
    address: contract._address,
    balance,
  };
};

const pollTokens = pollEvery(async (web3, { onBalance = () => {} } = {}) => {
  const { tokens } = await getNetwork();
  const tokenBalances = Object.values(tokenAddresses).reduce((accumulator, addr) => {
    accumulator[addr] = {
      contract: tokens[addr],
      balance: toBN(-1),
    };
    return accumulator;
  }, {});

  return {
    request: async () => {
      try {
        const [accounts, netId] = await Promise.all([web3.eth.getAccounts(), web3.eth.net.getId()]);

        // we are only interested in homeNetwork token balances
        if (accounts.length === 0 || netId !== config.homeNetworkId) {
          return defaultTokenBalances();
        }

        const balances = {};

        const setBalance = contract =>
          getTokenBalance(contract, accounts[0]).then(({ address, balance }) => {
            balances[address] = balance;
          });

        await Promise.all(Object.values(tokenBalances).map(({ contract }) => setBalance(contract)));

        return balances;
      } catch (e) {
        return defaultTokenBalances();
      }
    },
    onResult: balances => {
      const hasChanged = Object.keys(balances).some(
        addr => !balances[addr].eq(tokenBalances[addr].balance),
      );

      if (hasChanged) {
        Object.keys(tokenBalances).forEach(addr => {
          tokenBalances[addr].balance = balances[addr];
        });
        onBalance(balances);
      }
    },
  };
}, POLL_DELAY_TOKENS);

const pollAccount = pollEvery((web3, { onAccount = () => {}, onBalance = () => {} } = {}) => {
  let lastAccount = -1;
  let lastBalance = toBN(-1);
  return {
    request: async () => {
      try {
        const account = await getAccount(web3);
        if (!account) {
          throw new Error('no account');
        }
        const balance = await web3.eth.getBalance(account);
        return {
          account,
          balance: toBN(balance),
        };
      } catch (e) {
        return {
          balance: toBN(0),
        };
      }
    },
    onResult: ({ account, balance }) => {
      if (account !== lastAccount) {
        lastAccount = account;
        onAccount(account);
      }
      if (!balance.eq(lastBalance)) {
        lastBalance = balance;
        onBalance(balance);
      }
    },
  };
}, POLL_DELAY_ACCOUNT);

const fetchNetwork = async web3 => ({
  networkId: await web3.eth.net.getId(),
  networkType: await web3.eth.net.getNetworkType(),
});

const getNetworkState = (networkId, networkType) => ({
  isHomeNetwork: networkId === config.homeNetworkId,
  isForeignNetwork: networkId === config.foreignNetworkId,
  currentNetwork: networkType,
});

const pollNetwork = pollEvery((web3, { onNetwork = () => {} } = {}) => {
  let lastNetworkId;
  return {
    request: () => fetchNetwork(web3),
    onResult: ({ networkId, networkType }) => {
      if (networkId !== lastNetworkId) {
        lastNetworkId = networkId;
        onNetwork(networkId, networkType);
      }
    },
  };
}, POLL_DELAY_NETWORK);

class Web3Provider extends Component {
  constructor() {
    super();

    this.state = {
      account: undefined,
      balance: toBN(-1),
      tokenBalances: defaultTokenBalances(),
      currentNetwork: undefined,
      validProvider: false,
      isHomeNetwork: false,
      isForeignNetwork: false,
      isEnabled: false,
    };

    this.enableTimedout = false;

    this.enableProvider = this.enableProvider.bind(this);
  }

  componentWillMount() {
    getWeb3().then(web3 => {
      this.setState({
        validProvider: !web3.defaultNode,
      });

      pollNetwork(web3, {
        onNetwork: (networkId, networkType) => {
          this.setState(getNetworkState(networkId, networkType));
        },
      });

      if (!web3.defaultNode) {
        pollAccount(web3, {
          onAccount: async account => {
            this.setState({
              account,
              // TODO: find a way for non metamask providers
              isEnabled: await web3.currentProvider._metamask.isApproved(),
            });
          },
          onBalance: balance => {
            this.setState({
              balance,
            });
          },
        });

        pollTokens(web3, {
          onBalance: tokenBalances => {
            this.setState({
              tokenBalances,
            });
          },
        });
      }
    });

    this.enableProvider();
  }

  async enableProvider() {
    const web3 = await getWeb3();

    const { networkId, networkType } = await fetchNetwork(web3);
    this.setState(getNetworkState(networkId, networkType));

    if (web3.isEnabled) {
      this.setState(
        {
          isEnabled: true,
          account: await getAccount(web3),
        },
        () => this.props.onLoaded(),
      );
      return;
    }

    let isEnabled = false;
    let account;
    let balance;

    const timeoutId = setTimeout(async () => {
      this.setState({ isEnabled: await web3.currentProvider._metamask.isApproved() }, () =>
        this.props.onLoaded(),
      );
      this.enableTimedout = true;
    }, 5000);

    try {
      const accounts = await web3.enable(this.enableTimedout);
      clearTimeout(timeoutId);
      isEnabled = true;
      account = accounts.length ? accounts[0] : undefined;
      if (account) {
        balance = utils.toBN(await web3.eth.getBalance(account));
      }
    } catch (e) {
      // ignore
    }
    this.setState({ isEnabled, account, balance }, () => this.props.onLoaded());
  }

  render() {
    const {
      account,
      balance,
      tokenBalances,
      currentNetwork,
      validProvider,
      isHomeNetwork,
      isForeignNetwork,
      isEnabled,
    } = this.state;

    return (
      <Provider
        value={{
          state: {
            account,
            balance,
            tokenBalances,
            currentNetwork,
            validProvider,
            isHomeNetwork,
            isForeignNetwork,
            isEnabled,
          },
          actions: {
            enableProvider: this.enableProvider,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

Web3Provider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  onLoaded: PropTypes.func,
};

Web3Provider.defaultProps = {
  onLoaded: () => {},
};

export { Consumer };
export default Web3Provider;
