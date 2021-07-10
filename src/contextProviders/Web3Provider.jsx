import React, { Component, createContext, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Onboard from 'bnc-onboard';
import Web3 from 'web3';

import config from '../configuration';
import { ForeignRequiredModal, HomeRequiredModal } from '../components/NetworkWarningModal';

const Context = createContext();
const { Provider, Consumer } = Context;

const getNetworkState = networkId => ({
  isHomeNetwork: networkId === config.homeNetworkId,
  isForeignNetwork: networkId === config.foreignNetworkId,
});

const wallets = [
  { walletName: 'metamask', preferred: true },
  { walletName: 'torus', preferred: true },
];

class Web3Provider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: undefined,
      validProvider: false,
      isHomeNetwork: false,
      isForeignNetwork: false,
      showForeignNetRequiredWarning: false,
      showHomeNetRequiredWarning: false,
      onForeignNetWarningClose: undefined,
      foreignNetWarningButtonLabel: 'Close',
      onHomeNetWarningClose: undefined,
      homeNetWarningButtonLabel: 'Close',
    };
    this.enableProvider = this.enableProvider.bind(this);
    this.displayForeignNetRequiredWarning = this.displayForeignNetRequiredWarning.bind(this);
    this.displayHomeNetRequiredWarning = this.displayHomeNetRequiredWarning.bind(this);
    this.initOnBoard = this.initOnBoard.bind(this);
  }

  componentDidMount() {
    this.initOnBoard();
  }

  componentDidUpdate(prevProps, prevState, _) {
    if (prevState.networkId !== this.state.networkId) {
      this.state.onboard.config({ networkId: this.state.networkId });
    }
  }

  initOnBoard() {
    const onboard = Onboard({
      dappId: config.onboardDappId,
      networkId: config.foreignNetworkId,
      subscriptions: {
        wallet: wallet => {
          window.localStorage.setItem('selectedWallet', wallet.name);
          const web3 = new Web3(wallet.provider);
          this.setState({ validProvider: !!wallet.provider, web3 });
        },
        network: network => this.setState({ ...getNetworkState(network), networkId: network }),
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
  }

  enableProvider() {
    this.state.onboard.walletCheck().then();
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
      showForeignNetRequiredWarning,
      showHomeNetRequiredWarning,
      web3,
    } = this.state;

    const isEnabled = !!account && !!balance;

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
              account,
              balance,
              validProvider,
              isHomeNetwork,
              isForeignNetwork,
              isEnabled,
              web3,
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
};

export { Consumer, Context };
export default Web3Provider;
