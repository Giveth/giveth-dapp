import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';

import getWeb3 from '../lib/blockchain/getWeb3';
import config from '../configuration';

const { toBN } = utils;

const POLL_DELAY_ACCOUNT = 1000;
const POLL_DELAY_NETWORK = 2000;

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
  } catch (e) {}
  return undefined;
};

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
          balance: toBN(-1),
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

const pollNetwork = pollEvery((web3, { onNetwork = () => {} } = {}) => {
  let lastNetworkId;
  return {
    request: async () => {
      const networkId = await web3.eth.net.getId();
      const networkType = await web3.eth.net.getNetworkType();
      return { networkId, networkType };
    },
    onResult: ({ networkId, networkType }) => {
      if (networkId !== lastNetworkId) {
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
      currentNetwork: undefined,
      validProvider: false,
      isHomeNetwork: false,
      isForeignNetwork: false,
      isEnabled: false,
    };

    this.isLoaded = false;
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
          this.setState({
            currentNetwork: networkType,
            isHomeNetwork: networkId === config.homeNetworkId,
            isForeignNetwork: networkId === config.foreignNetworkId,
          });
        },
      });

      if (!web3.defaultNode) {
        pollAccount(web3, {
          onAccount: async account => {
            this.setState(
              {
                account,
                // TODO: find a way for non metamask providers
                isEnabled: await web3.currentProvider._metamask.isEnabled(),
              },
              () => !this.isLoaded && this.loaded(),
            );
          },
          onBalance: balance => {
            this.setState({
              balance,
            });
          },
        });
      }
    });

    this.enableProvider();
  }

  loaded() {
    this.isLoaded = true;
    this.props.onLoaded();
  }

  async enableProvider() {
    const web3 = await getWeb3();

    if (web3.isEnabled) {
      this.setState(
        {
          isEnabled: true,
          account: await getAccount(web3),
        },
        () => this.loaded(),
      );
      return;
    }

    let isEnabled = false;
    let account;
    let balance;

    const timeoutId = setTimeout(() => {
      this.setState({ isEnabled }, () => this.loaded());
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
    this.setState({ isEnabled, account, balance }, () => this.loaded());
  }

  render() {
    const {
      account,
      balance,
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
