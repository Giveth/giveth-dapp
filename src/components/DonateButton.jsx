/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-restricted-globals */
import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import Toggle from 'react-toggle';
import Slider from 'react-rangeslider';

import GA from 'lib/GoogleAnalytics';
import getNetwork from '../lib/blockchain/getNetwork';
import User from '../models/User';
import extraGas from '../lib/blockchain/extraGas';
import pollEvery from '../lib/pollEvery';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import DonationService from '../services/DonationService';
import { feathersClient } from '../lib/feathersClient';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import NetworkWarning from './NetworkWarning';
import SelectFormsy from './SelectFormsy';

const POLL_DELAY_TOKENS = 2000;

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'scroll',
  },
};

const _getTokenWhitelist = () => {
  const r = React.whitelist.tokenWhitelist;
  return r.map(t => {
    if (t.symbol === 'ETH') {
      t.name = `${config.homeNetworkName} ETH`;
    }
    t.balance = utils.toBN(0);
    return t;
  });
};

Modal.setAppElement('#root');

// tx only requires 25400 gas, but for some reason we get an out of gas
// error in web3 with that amount (even though the tx succeeds)
const DONATION_GAS = 30400;

class BaseDonateButton extends React.Component {
  constructor(props) {
    super(props);

    // set initial balance
    const modelToken = props.model.token;
    modelToken.balance = utils.toBN(0);

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: new BigNumber('0'),
      givethBridge: undefined,
      etherscanUrl: '',
      modalVisible: false,
      showCustomAddress: false,
      customAddress:
        props.currentUser && props.currentUser.address ? props.currentUser.address : undefined,
      tokenWhitelistOptions: _getTokenWhitelist().map(t => ({
        value: t.address,
        title: t.name,
      })),
      selectedToken:
        props.model.type === 'milestone'
          ? modelToken
          : _getTokenWhitelist().find(t => t.symbol === 'ETH'),
    };

    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    getNetwork().then(network => {
      this.setState({ givethBridge: network.givethBridge, etherscanUrl: network.homeEtherscan });
    });
    this.pollToken();
  }

  componentWillUnmount() {
    if (this.stopPolling) this.stopPolling();
  }

  setToken(address) {
    this.setState({ selectedToken: _getTokenWhitelist().find(t => t.address === address) }, () =>
      this.pollToken(),
    );
  }

  getMaxAmount() {
    const { selectedToken } = this.state;
    const { ETHBalance } = this.props;

    const balance = selectedToken.symbol === 'ETH' ? ETHBalance : selectedToken.balance;

    // Determine max amount
    let maxAmount = utils.fromWei(balance.toString());

    if (this.props.maxDonationAmount && balance.gt(this.props.maxDonationAmount))
      maxAmount = this.props.maxDonationAmount.toString();

    return maxAmount;
  }

  pollToken() {
    const { selectedToken } = this.state;
    const { isHomeNetwork, currentUser } = this.props;

    // stop existing poll
    if (this.stopPolling) {
      this.stopPolling();
      this.stopPolling = undefined;
    }
    // ETH balance is provided by the Web3Provider
    if (selectedToken.symbol === 'ETH') return;

    this.stopPolling = pollEvery(
      () => ({
        request: async () => {
          try {
            const { tokens } = await getNetwork();
            const contract = tokens[selectedToken.address];

            // we are only interested in homeNetwork token balances
            if (!isHomeNetwork || !currentUser || !currentUser.address || !contract) {
              return utils.toBN(0);
            }

            return utils.toBN(await contract.methods.balanceOf(currentUser.address).call());
          } catch (e) {
            return utils.toBN(0);
          }
        },
        onResult: balance => {
          if (!selectedToken.balance.eq(balance)) {
            selectedToken.balance = balance;
            this.setState({ selectedToken });
          }
        },
      }),
      POLL_DELAY_TOKENS,
    )();
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  closeDialog() {
    this.setState({
      modalVisible: false,
      amount: new BigNumber('0'),
      formIsValid: false,
    });
  }

  openDialog() {
    this.setState({
      modalVisible: true,
      amount: this.getMaxAmount(),
      formIsValid: false,
    });
  }

  submit(model) {
    this.donateWithBridge(model);
    this.setState({ isSaving: true });
  }

  donateWithBridge(model) {
    const { currentUser } = this.props;
    const { adminId } = this.props.model;
    const { givethBridge, etherscanUrl, showCustomAddress, selectedToken } = this.state;

    const value = utils.toWei(model.amount);
    const isDonationInToken = selectedToken.symbol !== 'ETH';
    const tokenAddress = isDonationInToken ? selectedToken.address : 0;

    const _makeDonationTx = async () => {
      let method;
      let donationUser;
      const opts = { from: currentUser.address, $extraGas: extraGas() };

      // actually uses 84766, but runs out of gas if exact
      if (!isDonationInToken) Object.assign(opts, { value, gas: DONATION_GAS });

      if (showCustomAddress) {
        // Donating on behalf of another user or address
        try {
          const user = await feathersClient.service('users').get(model.customAddress);
          if (user && user.giverId > 0) {
            method = givethBridge.donate(user.giverId, adminId, tokenAddress, value, opts);
            donationUser = user;
          } else {
            givethBridge.donateAndCreateGiver(
              model.customAddress,
              adminId,
              tokenAddress,
              value,
              opts,
            );
            donationUser = { address: model.customAddress };
          }
        } catch (e) {
          givethBridge.donateAndCreateGiver(
            model.customAddress,
            adminId,
            tokenAddress,
            value,
            opts,
          );
          donationUser = { address: model.customAddress };
        }
      } else {
        // Donating on behalf of logged in DApp user
        method =
          currentUser.giverId > 0
            ? givethBridge.donate(currentUser.giverId, adminId, tokenAddress, value, opts)
            : givethBridge.donateAndCreateGiver(
                currentUser.address,
                adminId,
                tokenAddress,
                value,
                opts,
              );
        donationUser = currentUser;
      }

      let txHash;
      method
        .on('transactionHash', async transactionHash => {
          txHash = transactionHash;
          this.closeDialog();
          await DonationService.newFeathersDonation(
            donationUser,
            this.props.model,
            value,
            selectedToken,
            txHash,
          );

          this.setState({
            modalVisible: false,
            isSaving: false,
          });

          GA.trackEvent({
            category: 'Donation',
            action: 'donated',
            label: `${etherscanUrl}tx/${txHash}`,
          });

          React.toast.info(
            <p>
              Awesome! Your donation is pending...
              <br />
              <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        })
        .then(() => {
          React.toast.success(
            <p>
              Woot! Woot! Donation received. You are awesome!
              <br />
              Note: because we are bridging networks, there will be a delay before your donation
              appears.
              <br />
              <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        })
        .catch(e => {
          if (!e.message.includes('User denied transaction signature')) {
            const err = !(e instanceof Error) ? JSON.stringify(e, null, 2) : e;
            ErrorPopup(
              'Something went wrong with your donation.',
              `${etherscanUrl}tx/${txHash} => ${err}`,
            );
          } else {
            React.toast.info('The transaction was cancelled. No donation has been made :-(');
          }
          this.setState({
            isSaving: false,
          });
        });
    };

    // if donating in token, first approve transfer of token by bridge
    if (isDonationInToken) {
      DonationService.approveERC20tokenTransfer(tokenAddress, currentUser.address, value)
        .then(() => _makeDonationTx())
        .catch(err => {
          this.setState({
            isSaving: false,
          });

          if (err.message !== 'cancelled') {
            ErrorPopup(
              'Something went wrong with your donation. Could not approve token allowance.',
              err,
            );
          }
        });
    } else {
      _makeDonationTx();
    }
  }

  render() {
    const { model, currentUser, isHomeNetwork, ETHBalance, validProvider } = this.props;
    const {
      amount,
      formIsValid,
      isSaving,
      modalVisible,
      customAddress,
      showCustomAddress,
      tokenWhitelistOptions,
      selectedToken,
    } = this.state;

    const style = {
      display: 'inline-block',
    };

    const balance = selectedToken.symbol === 'ETH' ? ETHBalance : selectedToken.balance;
    const maxAmount = this.getMaxAmount();

    return (
      <span style={style}>
        <button type="button" className="btn btn-success" onClick={this.openDialog}>
          Donate
        </button>
        <Modal
          isOpen={modalVisible}
          onRequestClose={() => this.closeDialog()}
          shouldCloseOnOverlayClick={false}
          contentLabel={`Support this ${model.type}!`}
          style={modalStyles}
        >
          <Form
            onSubmit={this.submit}
            mapping={inputs => ({
              amount: inputs.amount,
              customAddress: inputs.customAddress,
            })}
            onValid={() => this.toggleFormValid(true)}
            onInvalid={() => this.toggleFormValid(false)}
            layout="vertical"
          >
            <h3>
              Donate to support <em>{model.title}</em>
            </h3>

            {!validProvider && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                Please install <a href="https://metamask.io/">MetaMask</a> to donate
              </div>
            )}

            {validProvider && (
              <NetworkWarning
                incorrectNetwork={!isHomeNetwork}
                networkName={config.homeNetworkName}
              />
            )}
            {isHomeNetwork &&
              currentUser && (
                <p>
                  You&apos;re pledging: as long as the {model.type} owner does not lock your money
                  you can take it back any time.
                </p>
              )}

            {validProvider &&
              !currentUser && (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle" />
                  It looks like your Ethereum Provider is locked or you need to enable it.
                </div>
              )}

            {validProvider &&
              isHomeNetwork &&
              currentUser && (
                <div>
                  {model.type !== 'milestone' && (
                    <SelectFormsy
                      name="token"
                      id="token-select"
                      label="Make your donation in"
                      helpText="Select ETH or the token you want to donate"
                      value={selectedToken.address}
                      options={tokenWhitelistOptions}
                      onChange={address => this.setToken(address)}
                      disabled={model.type === 'milestone'}
                    />
                  )}
                  {/* TODO: remove this b/c the wallet provider will contain this info */}
                  {config.homeNetworkName} {selectedToken.symbol} balance:&nbsp;
                  <em>{utils.fromWei(balance ? balance.toString() : '')}</em>
                </div>
              )}

            <span className="label">How much {selectedToken.symbol} do you want to donate?</span>

            {validProvider &&
              maxAmount.toNumber() !== 0 &&
              balance.gtn(0) && (
                <div className="form-group">
                  <Slider
                    type="range"
                    name="amount2"
                    min={0}
                    max={maxAmount.toNumber()}
                    step={maxAmount.toNumber() / 10}
                    value={amount.toNumber()}
                    labels={{
                      0: '0',
                      [maxAmount.toFixed()]: maxAmount.toFixed(),
                    }}
                    tooltip={false}
                    onChange={newAmount => this.setAmount(newAmount)}
                  />
                </div>
              )}

            <div className="form-group">
              <Input
                name="amount"
                id="amount-input"
                type="number"
                value={amount.toString()}
                onChange={(name, newAmount) => this.setAmount(newAmount)}
                validations={{
                  lessOrEqualTo: maxAmount.toNumber(),
                  greaterThan: 0.009,
                }}
                validationErrors={{
                  greaterThan: `Minimum value must be at least 0.01 ${selectedToken.symbol}`,
                  lessOrEqualTo: `This donation exceeds your wallet balance or the milestone max amount: ${maxAmount.toString()} ${
                    selectedToken.symbol
                  }.`,
                }}
                autoFocus
              />
            </div>

            {showCustomAddress && (
              <div className="alert alert-success">
                <i className="fa fa-exclamation-triangle" />
                The donation will be donated on behalf of address:
              </div>
            )}

            <div className="react-toggle-container">
              <Toggle
                id="show-recipient-address"
                defaultChecked={showCustomAddress}
                onChange={() =>
                  this.setState(prevState => ({
                    showCustomAddress: !prevState.showCustomAddress,
                  }))
                }
              />
              <div className="label">I want to donate on behalf of another address</div>
            </div>
            {showCustomAddress && (
              <div className="form-group recipient-address-container">
                <Input
                  name="customAddress"
                  id="title-input"
                  type="text"
                  value={customAddress}
                  placeholder="0x0000000000000000000000000000000000000000"
                  validations="isEtherAddress"
                  validationErrors={{
                    isEtherAddress: 'Please insert a valid Ethereum address.',
                  }}
                  required={this.state.showRecipientAddress}
                />
              </div>
            )}
            {!showCustomAddress && (
              <div>
                <br />
                <br />
              </div>
            )}

            {validProvider &&
              currentUser &&
              maxAmount.toNumber() !== 0 &&
              balance !== '0' && (
                <LoaderButton
                  className="btn btn-success"
                  formNoValidate
                  type="submit"
                  disabled={isSaving || !formIsValid || !isHomeNetwork}
                  isLoading={isSaving}
                  loadingText="Donating..."
                >
                  Donate
                </LoaderButton>
              )}

            <button
              className="btn btn-light float-right"
              type="button"
              onClick={() => {
                this.setState({ modalVisible: false });
              }}
            >
              Close
            </button>
          </Form>
        </Modal>
      </span>
    );
  }
}

const DonateButton = ({ model, currentUser, maxDonationAmount }) => (
  <Web3Consumer>
    {({ state: { isHomeNetwork, validProvider, balance } }) => (
      <BaseDonateButton
        ETHBalance={balance}
        validProvider={validProvider}
        isHomeNetwork={isHomeNetwork}
        model={model}
        currentUser={currentUser}
        maxDonationAmount={maxDonationAmount}
      />
    )}
  </Web3Consumer>
);

const modelTypes = PropTypes.shape({
  type: PropTypes.string.isRequired,
  adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
});

DonateButton.propTypes = {
  model: modelTypes.isRequired,
  currentUser: PropTypes.instanceOf(User),
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
};

// eslint isn't smart enough to be able to use Object.assign({}, DonateButton.propTypes, {...})
// so we have to duplicate them
BaseDonateButton.propTypes = {
  model: modelTypes.isRequired,
  currentUser: PropTypes.instanceOf(User),
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  ETHBalance: PropTypes.instanceOf(BigNumber).isRequired,
  validProvider: PropTypes.bool.isRequired,
  isHomeNetwork: PropTypes.bool.isRequired,
};

DonateButton.defaultProps = {
  currentUser: undefined,
  maxDonationAmount: new BigNumber(10000000000000000),
};

BaseDonateButton.defaultProps = {
  currentUser: undefined,
  maxDonationAmount: new BigNumber(10000000000000000),
};

export default DonateButton;
