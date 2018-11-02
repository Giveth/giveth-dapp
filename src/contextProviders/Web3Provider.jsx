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
    // bug doesn't update accounts when changed w/ enable
    const addrs = web3.isEnabled ? await web3.eth.getAccounts() : await web3.enable();
    if (addrs.length > 0) return addrs[0];
  } catch (e) {}
  return undefined;
};

const pollAccount = pollEvery((web3, { onAccount = () => {}, onBalance = () => {} } = {}) => {
  let lastAccount;
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
          onAccount: account => {
            console.log('account', account);
            this.setState({
              account,
              // TODO: find a way to determine if the provider is locked or not enabled
              isEnabled: !!account,
            });
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

  async enableProvider() {
    const web3 = await getWeb3();

    let isEnabled = false;

    const timeoutId = setTimeout(() => {
      this.setState({ isEnabled });
    }, 5000);

    try {
      // TODO: there is very inconsistant behavior here
      // on first load, if metamask is locked, this will never resolve
      // however if you unlock metamask or metamask is unlocked upon first
      // load, then you lock metamask, this will resolve to []
      // also, calling web3.enable() does not reflect any account changes
      console.log('enabling', await web3.currentProvider.enable());
      // console.log('enabling', await web3.enable());
      clearTimeout(timeoutId);
      isEnabled = true;
    } catch (e) {}
    this.setState({ isEnabled });
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
};

export { Consumer };
export default Web3Provider;
