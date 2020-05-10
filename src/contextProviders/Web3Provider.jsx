import React, { Component, createContext, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import getWeb3 from '../lib/blockchain/getWeb3';
import pollEvery from '../lib/pollEvery';
import config from '../configuration';
import { signUpSwal } from '../lib/helpers';
import { ForeignRequiredModal, HomeRequiredModal } from '../components/NetworkWarningModal';

const POLL_DELAY_ACCOUNT = 1000;
const POLL_DELAY_NETWORK = 2000;

const Context = createContext();
const { Provider, Consumer } = Context;

const getAccount = async web3 => {
  try {
    const addrs = await web3.eth.getAccounts();
    if (addrs.length > 0) return addrs[0];
  } catch (e) {
    // ignore
  }
  return undefined;
};

const pollAccount = pollEvery((web3, { onAccount = () => {}, onBalance = () => {} } = {}) => {
  let lastAccount = -1;
  let lastBalance = new BigNumber(-1);
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
          balance: new BigNumber(balance),
        };
      } catch (e) {
        return {
          balance: new BigNumber(0),
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
  constructor(props) {
    super(props);

    this.state = {
      account: undefined,
      balance: new BigNumber(0),
      currentNetwork: undefined,
      validProvider: false,
      isHomeNetwork: false,
      isForeignNetwork: false,
      isEnabled: false,
      setupTimeout: false,
      showForeignNetRequiredWarning: false,
      showHomeNetRequiredWarning: false,
      onForeignNetWarningClose: undefined,
      onHomeNetWarningClose: undefined,
    };

    this.enableTimedout = false;

    this.enableProvider = this.enableProvider.bind(this);
    this.displayForeignNetRequiredWarning = this.displayForeignNetRequiredWarning.bind(this);
    this.displayHomeNetRequiredWarning = this.displayHomeNetRequiredWarning.bind(this);
    this.initWeb3Provider();
  }

  initWeb3Provider() {
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
      }
      this.finishLoading(web3);
    });
  }

  async finishLoading(web3) {
    const { networkId, networkType } = await fetchNetwork(web3);
    this.setState(getNetworkState(networkId, networkType));
    this.setState(
      {
        setupTimeout: false,
        isEnabled:
          web3.currentProvider._metamask && web3.currentProvider._metamask
            ? await web3.currentProvider._metamask.isApproved()
            : false,
      },
      () => this.props.onLoaded(),
    );
  }

  async enableProvider() {
    const { validProvider } = this.state;
    if (!validProvider) {
      signUpSwal();
    }
    // we set this timeout b/c if the provider is connected to an invalid network,
    // any rpc calls will hang
    const timeout = setTimeout(async () => {
      React.swal({
        title: 'Web3 Connection Error',
        content: React.swal.msg(
          <p>
            Unable to connect to the web3 provider. Please check if your MetaMask (or other web3
            provider) is connected to a valid network. If so try restarting your browser or open the
            DApp in private window.
          </p>,
        ),
      });
      this.setState({ setupTimeout: true }, () => this.props.onLoaded());
    }, 5000);

    const web3 = await getWeb3();

    // If we are using the default node, then the user doesn't have an injected
    // web3 provider. Not need to enable the provider
    if (web3.defaultNode) {
      clearTimeout(timeout);
      this.props.onLoaded();
      return;
    }

    const { networkId, networkType } = await fetchNetwork(web3);
    this.setState(getNetworkState(networkId, networkType));

    // clear timeout here b/c we have successfully made an rpc call thus we are
    // successfully connected to a network
    clearTimeout(timeout);

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
      this.setState(
        {
          isEnabled:
            web3.currentProvider._metamask && web3.currentProvider._metamask
              ? await web3.currentProvider._metamask.isApproved()
              : false,
        },
        () => this.props.onLoaded(),
      );
      this.enableTimedout = true;
    }, 5000);

    try {
      const accounts = await web3.enable(this.enableTimedout);
      clearTimeout(timeoutId);
      isEnabled = true;
      account = accounts.length ? accounts[0] : undefined;
      if (account) {
        balance = new BigNumber(await web3.eth.getBalance(account));
      }
    } catch (e) {
      // ignore
    }
    this.setState({ isEnabled, account, balance }, () => this.props.onLoaded());
  }

  displayForeignNetRequiredWarning(onClose) {
    this.setState({
      showForeignNetRequiredWarning: true,
      onForeignNetWarningClose: onClose,
    });
  }

  displayHomeNetRequiredWarning(onClose) {
    this.setState({
      showHomeNetRequiredWarning: true,
      onHomeNetWarningClose: onClose,
    });
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
      setupTimeout,
      showForeignNetRequiredWarning,
      showHomeNetRequiredWarning,
    } = this.state;

    return (
      <Fragment>
        <ForeignRequiredModal
          show={showForeignNetRequiredWarning}
          closeModal={() => {
            const onClose = this.state.onForeignNetWarningClose || (() => {});
            this.setState(
              {
                showForeignNetRequiredWarning: false,
                onForeignNetWarningClose: undefined,
              },
              onClose,
            );
          }}
        />
        <HomeRequiredModal
          show={showHomeNetRequiredWarning}
          closeModal={() => {
            const onClose = this.state.onHomeNetWarningClose || (() => {});
            this.setState(
              {
                showHomeNetRequiredWarning: false,
                onHomeNetWarningClose: undefined,
              },
              onClose,
            );
          }}
        />
        <Provider
          value={{
            state: {
              failedToLoad: setupTimeout,
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
              displayForeignNetRequiredWarning: this.displayForeignNetRequiredWarning,
              displayHomeNetRequiredWarning: this.displayHomeNetRequiredWarning,
            },
          }}
        >
          {this.props.children}
        </Provider>
      </Fragment>
    );
  }
}

Web3Provider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  onLoaded: PropTypes.func.isRequired,
};

Web3Provider.defaultProps = {};

export { Consumer };
export default Web3Provider;
