import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import Toggle from 'react-toggle';

import GA from 'lib/GoogleAnalytics';
import getNetwork from '../lib/blockchain/getNetwork';
import User from '../models/User';
import getWeb3 from '../lib/blockchain/getWeb3';
import extraGas from '../lib/blockchain/extraGas';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import DonationService from '../services/DonationService';
import { feathersClient } from '../lib/feathersClient';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import NetworkWarning from './NetworkWarning';
import SelectFormsy from './SelectFormsy';

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
    // t.balance = '0';
    return t;
  });
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
    // modelToken.balance = '0';

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      web3: undefined,
      account: undefined,
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
    getWeb3().then(web3 => {
      this.setState({ web3 });
    });
  }

  setToken(address) {
    this.setState({ selectedToken: _getTokenWhitelist().find(t => t.address === address) });
  }

  getDonationData() {
    const { givethBridge, account } = this.state;
    const { currentUser } = this.props;
    const { adminId } = this.props.model;

    if (currentUser) {
      return currentUser.giverId > 0
        ? givethBridge.$contract.methods.donate(currentUser.giverId, adminId).encodeABI()
        : givethBridge.$contract.methods
            .donateAndCreateGiver(currentUser.address, adminId)
            .encodeABI();
    }
    return givethBridge.$contract.methods.donateAndCreateGiver(account, adminId).encodeABI();
  }

  // setMaxAmount(maxAmount) {
  // this.setState({ amount: maxAmount });
  // }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  closeDialog() {
    this.setState({
      modalVisible: false,
      amount: '',
      formIsValid: false,
    });
  }

  openDialog() {
    this.setState({
      modalVisible: true,
      amount: '',
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
    const { account, givethBridge, etherscanUrl, showCustomAddress, selectedToken } = this.state;

    const value = utils.toWei(model.amount);
    const isDonationInToken = selectedToken.symbol !== 'ETH';
    const tokenAddress = isDonationInToken ? selectedToken.address : 0;

    const _makeDonationTx = async () => {
      let method;
      let donationUser;
      const opts = { from: account, $extraGas: extraGas() };

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
      } else if (currentUser) {
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
      } else {
        // Donating without any user
        method = givethBridge.donateAndCreateGiver(account, adminId, tokenAddress, value, opts);
        donationUser = { address: account };
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
      DonationService.approveERC20tokenTransfer(tokenAddress, account, value)
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
    return (
      <Web3Consumer>
        {({ state: { isHomeNetwork, validProvider, balance: ETHBalance, tokenBalances } }) => {
          const { model, currentUser } = this.props;
          const {
            web3,
            givethBridge,
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
            selectedToken.symbol === 'ETH' ? ETHBalance : tokenBalances[selectedToken.address];

          // Determine max amount
          let maxAmount = 10000000000000000;
          if (this.props.maxAmount && balance.gtn(this.props.maxAmount))
            maxAmount = utils.fromWei(this.props.maxAmount);
          else if (web3) maxAmount = utils.fromWei(balance);
          return (
            <span style={style}>
              <button type="button" className="btn btn-success" onClick={this.openDialog}>
                Donate
              </button>
              <Modal
                isOpen={modalVisible}
                onRequestClose={() => this.closeDialog()}
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
                      It is recommended that you install <a href="https://metamask.io/">
                        MetaMask
                      </a>{' '}
                      to donate
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
                        You&apos;re pledging: as long as the {model.type} owner does not lock your
                        money you can take it back any time.
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
                      <p>
                        {model.type !== 'milestone' && (
                          <SelectFormsy
                            name="token"
                            id="token-select"
                            label="Make your donation in"
                            helpText="Select ETH or the token you want to donate"
                            value={selectedToken.address}
                            cta="--- Select ---"
                            options={tokenWhitelistOptions}
                            onChange={address => this.setToken(address)}
                            disabled={model.type === 'milestone'}
                          />
                        )}
                        {/* TODO: remove this b/c the wallet provider will contain this info */}
                        {config.homeNetworkName} {selectedToken.symbol} balance:&nbsp;
                        <em>{utils.fromWei(balance)}</em>
                      </p>
                    )}

                  {/* {validProvider &&
                  isHomeNetwork &&
                  currentUser &&
                  balance.eqn(0) && (
                    <div className="alert alert-warning">
                      <i className="fa fa-exclamation-triangle" />
                      You do not have an adequate balance in your account to donate.
                    </div>
                  )} */}

                  {/* {validProvider &&
                    maxAmount !== 0 &&
                    balance.gtn(0) && (
                      <div className="form-group">
                        <Slider
                          type="range"
                          name="amount2"
                          min={0}
                          max={Number(maxAmount)}
                          step={0.01}
                          value={Number(Number(this.state.amount).toFixed(4))}
                          labels={{
                            0: '0',
                            [maxAmount]: Number(Number(maxAmount).toFixed(4)),
                          }}
                          format={val => `${val} ETH`}
                          onChange={newAmount => this.setState({ amount: newAmount.toString() })}
                        />
                      </div>
                    )} */}

                  <div className="form-group">
                    <Input
                      name="amount"
                      id="amount-input"
                      label={`How much ${selectedToken.symbol} do you want to donate?`}
                      type="number"
                      step="any"
                      value={amount}
                      placeholder="1"
                      validations={{
                        lessOrEqualTo: maxAmount,
                        greaterThan: 0.009,
                      }}
                      validationErrors={{
                        greaterThan: `Minimum value must be at least ${selectedToken.symbol}0.01`,
                        lessOrEqualTo: `This donation exceeds your wallet balance or the milestone max amount: ${maxAmount} ${
                          selectedToken.symbol
                        }.`,
                      }}
                      required
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
                    maxAmount !== 0 &&
                    balance !== '0' && (
                      <LoaderButton
                        className="btn btn-success"
                        formNoValidate
                        type="submit"
                        disabled={isSaving || !formIsValid || !isHomeNetwork}
                        isLoading={isSaving}
                        loadingText="Saving..."
                      >
                        Donate
                      </LoaderButton>
                    )}

                  {/* {!validProvider && <div>TODO: show donation data</div>} */}

                  {/* TODO get amount to dynamically update */}
                  {givethBridge && (
                    <a
                      className={`btn btn-primary ${isSaving ? 'disabled' : ''}`}
                      disabled={!givethBridge || !amount}
                      href={`https://mycrypto.com?to=${
                        givethBridge.$address
                      }&data=${this.getDonationData()}&value=${amount}&gasLimit=${DONATION_GAS}#send-transaction`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Donate via MyCrypto
                    </a>
                  )}
                </Form>
              </Modal>
            </span>
          );
        }}
      </Web3Consumer>
    );
  }
}

DonateButton.propTypes = {
  model: PropTypes.shape({
    type: PropTypes.string.isRequired,
    adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    campaignId: PropTypes.string,
    token: PropTypes.shape({}),
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  maxAmount: PropTypes.string,
};

DonateButton.defaultProps = {
  maxAmount: undefined,
  currentUser: undefined,
};

export default DonateButton;
