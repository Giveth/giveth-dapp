import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import Toggle from 'react-toggle';
import Slider from 'react-rangeslider';
import GA from 'lib/GoogleAnalytics';
import { Link } from 'react-router-dom';

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
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';
import DAC from '../models/DAC';

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

Modal.setAppElement('#root');

// tx only requires 25400 gas, but for some reason we get an out of gas
// error in web3 with that amount (even though the tx succeeds)
const DONATION_GAS = 30400;

class DonateButton extends React.Component {
  constructor(props) {
    super(props);

    // set initial balance
    const modelToken = props.model.token;
    if (modelToken) modelToken.balance = new BigNumber(0);

    this.state = {
      isSaving: false,
      formIsValid: false,
      defaultAmount: true,
      amount: '1',
      givethBridge: undefined,
      etherscanUrl: '',
      modalVisible: false,
      showCustomAddress: false,
      customAddress:
        props.currentUser && props.currentUser.address ? props.currentUser.address : undefined,
      tokenWhitelistOptions: props.tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
      selectedToken: props.model.acceptsSingleToken ? modelToken : props.tokenWhitelist[0],
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
    const { amount, defaultAmount } = this.state;
    const token = this.props.tokenWhitelist.find(t => t.address === address);
    token.balance = new BigNumber('0'); // FIXME: There should be a balance provider handling all of this...

    let amt = amount;
    if (defaultAmount) {
      amt = token.symbol === config.nativeTokenName ? '1' : '100';
    }
    this.setState(
      {
        selectedToken: token,
        amount: amt,
      },
      () => this.pollToken(),
    );
  }

  getMaxAmount() {
    const { selectedToken } = this.state;
    const { NativeTokenBalance } = this.props;

    const balance =
      selectedToken.symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;

    // Determine max amount
    let maxAmount = new BigNumber(utils.fromWei(balance.toFixed()));

    if (this.props.maxDonationAmount) {
      maxAmount = maxAmount.gt(this.props.maxDonationAmount)
        ? this.props.maxDonationAmount
        : maxAmount;
    }

    return maxAmount;
  }

  pollToken() {
    const { selectedToken } = this.state;
    const { isCorrectNetwork, currentUser } = this.props;

    // stop existing poll
    if (this.stopPolling) {
      this.stopPolling();
      this.stopPolling = undefined;
    }
    // Native token balance is provided by the Web3Provider
    if (selectedToken.symbol === config.nativeTokenName) return;

    this.stopPolling = pollEvery(
      () => ({
        request: async () => {
          try {
            const { tokens } = await getNetwork();
            const contract = tokens[selectedToken.address];

            // we are only interested in homeNetwork token balances
            if (!isCorrectNetwork || !currentUser || !currentUser.address || !contract) {
              return new BigNumber(0);
            }

            return new BigNumber(await contract.methods.balanceOf(currentUser.address).call());
          } catch (e) {
            return new BigNumber(0);
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
      amount: '1',
      defaultAmount: true,
      formIsValid: false,
    });
  }

  openDialog() {
    const { model } = this.props;
    this.setState(prevState => {
      const { isCapped } = model;
      const amount = isCapped ? this.getMaxAmount().toFixed() : prevState.amount;
      return {
        modalVisible: true,
        amount,
        defaultAmount: isCapped ? false : prevState.defaultAmount,
        formIsValid: false,
      };
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
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
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
    const { model, currentUser, NativeTokenBalance, validProvider, isCorrectNetwork } = this.props;
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

    const balance =
      selectedToken.symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;
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
                incorrectNetwork={!isCorrectNetwork}
                networkName={config.homeNetworkName}
              />
            )}
            {isCorrectNetwork && currentUser && (
              <p>
                {model.type.toLowerCase() === DAC.type && (
                  <span>
                    You&apos;re pledging: as long as the DAC owner does not lock your money you can
                    take it back any time.
                  </span>
                )}
                {model.type.toLowerCase() !== DAC.type && (
                  <span>
                    You&apos;re committing your funds to this {model.type}, if you have filled out
                    contact information in your <Link to="/profile">Profile</Link> you will be
                    notified about how your funds are spent
                  </span>
                )}
              </p>
            )}

            {validProvider && !currentUser && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like your Ethereum Provider is locked or you need to enable it.
              </div>
            )}

            {validProvider && isCorrectNetwork && currentUser && (
              <div>
                {!model.acceptsSingleToken && (
                  <SelectFormsy
                    name="token"
                    id="token-select"
                    label="Make your donation in"
                    helpText={`Select ${config.nativeTokenName} or the token you want to donate`}
                    value={selectedToken.address}
                    options={tokenWhitelistOptions}
                    onChange={address => this.setToken(address)}
                  />
                )}
                {/* TODO: remove this b/c the wallet provider will contain this info */}
                {config.homeNetworkName} {selectedToken.symbol} balance:&nbsp;
                <em>{utils.fromWei(balance ? balance.toFixed() : '')}</em>
              </div>
            )}

            <span className="label">How much {selectedToken.symbol} do you want to donate?</span>

            {validProvider && maxAmount.toNumber() !== 0 && balance.gt(0) && (
              <div className="form-group">
                <Slider
                  type="range"
                  name="amount2"
                  min={0}
                  max={maxAmount.toNumber()}
                  step={maxAmount.toNumber() / 10}
                  value={Number(Number(amount).toFixed(4))}
                  labels={{
                    0: '0',
                    [maxAmount.toFixed()]: maxAmount.toFixed(4),
                  }}
                  tooltip={false}
                  format={val => `${val} ${config.nativeTokenName}`}
                  onChange={newAmount => this.setState({ amount: newAmount.toString() })}
                />
              </div>
            )}

            <div className="form-group">
              <Input
                name="amount"
                id="amount-input"
                type="number"
                value={amount}
                onChange={(name, newAmount) =>
                  this.setState({ amount: newAmount, defaultAmount: false })
                }
                validations={{
                  lessOrEqualTo: maxAmount.toNumber(),
                  greaterThan: 0,
                }}
                validationErrors={{
                  greaterThan: `Please enter value greater than 0 ${selectedToken.symbol}`,
                  lessOrEqualTo: `This donation exceeds your wallet balance or the Milestone max amount: ${maxAmount.toFixed()} ${
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

            {validProvider && currentUser && maxAmount.toNumber() !== 0 && balance !== '0' && (
              <LoaderButton
                className="btn btn-success"
                formNoValidate
                type="submit"
                disabled={isSaving || !formIsValid || !isCorrectNetwork}
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

const modelTypes = PropTypes.shape({
  type: PropTypes.string.isRequired,
  adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
  acceptsSingleToken: PropTypes.bool,
});

DonateButton.propTypes = {
  model: modelTypes.isRequired,
  currentUser: PropTypes.instanceOf(User),
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  NativeTokenBalance: PropTypes.instanceOf(BigNumber).isRequired,
  validProvider: PropTypes.bool.isRequired,
  isCorrectNetwork: PropTypes.bool.isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

DonateButton.defaultProps = {
  currentUser: undefined,
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
};

export default props => (
  <WhiteListConsumer>
    {({ state: { tokenWhitelist } }) => (
      <Web3Consumer>
        {({ state: { isHomeNetwork, validProvider, balance } }) => (
          <DonateButton
            NativeTokenBalance={balance}
            validProvider={validProvider}
            isCorrectNetwork={isHomeNetwork}
            tokenWhitelist={tokenWhitelist}
            {...props}
          />
        )}
      </Web3Consumer>
    )}
  </WhiteListConsumer>
);
