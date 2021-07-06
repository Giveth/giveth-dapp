import React, { Component, createContext, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Onboard from 'bnc-onboard';
import Web3 from 'web3';

import config from '../configuration';
import { ForeignRequiredModal, HomeRequiredModal } from '../components/NetworkWarningModal';

const Context = createContext();
const { Provider, Consumer } = Context;

// const getAccount = async web3 => {
//   try {
//     const addrs = await web3.eth.getAccounts();
//     if (addrs.length > 0) return addrs[0];
//   } catch (e) {
//     // ignore
//   }
//   return undefined;
// };

// const fetchNetwork = async web3 => ({
//   networkId: await web3.eth.net.getId(),
// });

const getNetworkState = networkId => ({
  isHomeNetwork: networkId === config.homeNetworkId,
  isForeignNetwork: networkId === config.foreignNetworkId,
});

const wallets = [
  { walletName: 'metamask', preferred: true },
  // { walletName: 'torus', preferred: true }
];

class Web3Provider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: undefined,
      balance: new BigNumber(0),
      validProvider: false,
      isHomeNetwork: false,
      isForeignNetwork: false,
      isEnabled: false,
      setupTimeout: false,
      showForeignNetRequiredWarning: false,
      showHomeNetRequiredWarning: false,
      onForeignNetWarningClose: undefined,
      foreignNetWarningButtonLabel: 'Close',
      onHomeNetWarningClose: undefined,
      homeNetWarningButtonLabel: 'Close',
    };

    this.enableTimedout = false;

    this.enableProvider = this.enableProvider.bind(this);
    this.displayForeignNetRequiredWarning = this.displayForeignNetRequiredWarning.bind(this);
    this.displayHomeNetRequiredWarning = this.displayHomeNetRequiredWarning.bind(this);
    this.initOnBoard = this.initOnBoard.bind(this);
  }

  componentDidMount() {
    this.initOnBoard();
  }

  initOnBoard() {
    const dappId = '4b28f36b-c725-4475-8cef-af4850473e50';
    const networkId = 4;

    // initialize onboard
    const onboard = Onboard({
      dappId,
      networkId,
      subscriptions: {
        wallet: wallet => {
          // instantiate web3 when the user has selected a wallet
          window.localStorage.setItem('selectedWallet', wallet.name);
          const web3 = new Web3(wallet.provider);
          console.log(web3);
          this.setState({ validProvider: !!wallet.provider });
          console.log(`${wallet.name} connected!`);
        },
        network: network => this.setState({ ...getNetworkState(network) }),
        address: address => this.setState({ account: address }),
        balance: balance => this.setState({ balance: new BigNumber(balance) }),
      },
      walletSelect: {
        wallets,
      },
    });

    const previouslySelectedWallet = window.localStorage.getItem('selectedWallet');
    if (previouslySelectedWallet && onboard) {
      onboard.walletSelect(previouslySelectedWallet).then();
    } else {
      onboard.walletSelect().then();
    }

    this.setState({ onboard });
    this.props.onLoaded();
  }

  enableProvider() {
    this.state.onboard.walletCheck().then();
    // console.log(this.state.onboard.getState())
  }

  displayForeignNetRequiredWarning(onClose, buttonLabel = 'Close') {
    this.setState({
      showForeignNetRequiredWarning: true,
      onForeignNetWarningClose: onClose,
      foreignNetWarningButtonLabel: buttonLabel,
    });
  }

  displayHomeNetRequiredWarning(onClose, buttonLabel = 'Close') {
    this.setState({
      showHomeNetRequiredWarning: true,
      onHomeNetWarningClose: onClose,
      homeNetWarningButtonLabel: buttonLabel,
    });
  }

  render() {
    const {
      account,
      balance,
      validProvider,
      isHomeNetwork,
      isForeignNetwork,
      isEnabled,
      setupTimeout,
      showForeignNetRequiredWarning,
      showHomeNetRequiredWarning,
    } = this.state;
    // console.log(balance, network, address);
    return (
      <Fragment>
        <ForeignRequiredModal
          show={showForeignNetRequiredWarning && !isForeignNetwork}
          closeModal={() => {
            const onClose = this.state.onForeignNetWarningClose || (() => {});
            this.setState(
              {
                showForeignNetRequiredWarning: false,
                onForeignNetWarningClose: undefined,
                foreignNetWarningButtonLabel: 'Close',
              },
              onClose,
            );
          }}
          buttonLabel={this.state.foreignNetWarningButtonLabel}
        />
        <HomeRequiredModal
          show={showHomeNetRequiredWarning && !isHomeNetwork}
          closeModal={() => {
            const onClose = this.state.onHomeNetWarningClose || (() => {});
            this.setState(
              {
                showHomeNetRequiredWarning: false,
                onHomeNetWarningClose: undefined,
                homeNetWarningButtonLabel: undefined,
              },
              onClose,
            );
          }}
          buttonLabel={this.state.homeNetWarningButtonLabel}
        />
        <Provider
          value={{
            state: {
              failedToLoad: setupTimeout,
              account,
              balance,
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

export { Consumer, Context };
export default Web3Provider;
