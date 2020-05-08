import React, { Fragment } from 'react';
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
import DACService from '../services/DACService';
import { feathersClient } from '../lib/feathersClient';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import ActionNetworkWarning from './ActionNetworkWarning';
import SelectFormsy from './SelectFormsy';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';
import DAC from '../models/DAC';
import { ZERO_ADDRESS } from '../lib/helpers';

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

    const { tokenWhitelist, model } = this.props;
    const defaultToken =
      tokenWhitelist.find(t => t.symbol === config.defaultDonateToken) || tokenWhitelist[0];

    const selectedToken = model.acceptsSingleToken ? modelToken : defaultToken;

    this.state = {
      isSaving: false,
      formIsValid: false,
      defaultAmount: true,
      amount: selectedToken === config.nativeTokenName ? '1' : '100',
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
      selectedToken,
    };

    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    getNetwork().then(network => {
      this.setState({
        givethBridge: network.givethBridge,
        etherscanUrl: network.homeEtherscan,
      });
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
    const { model } = this.props;
    const { dacId } = model;

    const balance =
      selectedToken.symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;

    // Determine max amount

    if (balance === undefined) return new BigNumber(0);
    const maxFromWei = utils.fromWei(balance.toFixed());
    let maxAmount;
    if (maxFromWei.isNaN || maxFromWei === 'NaN') {
      maxAmount = new BigNumber(0);
    } else {
      maxAmount = new BigNumber(maxFromWei);
    }

    let { maxDonationAmount } = this.props;
    if (maxDonationAmount) {
      if (dacId !== undefined && dacId !== 0) {
        maxDonationAmount *= 1.03;
      }
      maxAmount = maxAmount.gt(maxDonationAmount) ? BigNumber(maxDonationAmount) : maxAmount;
    }

    return maxAmount;
  }

  async getDacTitle(model, adminId, dacId) {
    DACService.getDACs(
      1, // Limit
      0, // Skip
      (dacs, _) => {
        let dacTitle = '';
        dacs.forEach(d => {
          if (d.myDelegateId === dacId) dacTitle = d._title;
        });
        this.donateToDac(model, adminId, dacId, dacTitle, model.amount);
      },
      () => {},
    );
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  closeDialog() {
    const { tokenWhitelist, model } = this.props;
    const defaultToken =
      tokenWhitelist.find(t => t.symbol === config.defaultDonateToken) || tokenWhitelist[0];
    const selectedToken = model.acceptsSingleToken ? model.token : defaultToken;

    this.setState({
      modalVisible: false,
      amount: selectedToken === config.nativeTokenName ? '1' : '100',
      defaultAmount: true,
      formIsValid: false,
      selectedToken,
    });
  }

  canDonateToProject() {
    const { model, tokenWhitelist } = this.props;
    const { acceptsSingleToken, token } = model;
    return (
      !acceptsSingleToken ||
      tokenWhitelist.find(
        t => t.foreignAddress.toLocaleLowerCase() === token.foreignAddress.toLocaleLowerCase(),
      )
    );
  }

  openDialog() {
    if (!this.canDonateToProject()) {
      React.swal({
        title: 'Token is not Active to Donate',
        content: React.swal.msg(
          <div>
            <p>
              Token <strong>{this.props.model.token.symbol}</strong> cannot be directly donated
              anymore.
              <br />
              <strong>Delegate</strong> and <strong>Withdraw</strong> actions are still available
              for this token.
            </p>
          </div>,
        ),
      });
    } else {
      this.setState(prevState => {
        const { model } = this.props;
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
  }

  submit(model) {
    const { adminId, dacId } = this.props.model;

    if (dacId !== undefined && dacId !== 0) {
      this.getDacTitle(model, adminId, dacId, model.amount);
    } else {
      this.donateWithBridge(model, adminId, model.amount);
    }

    this.setState({ isSaving: true });
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
          if (!selectedToken.balance || !selectedToken.balance.eq(balance)) {
            selectedToken.balance = balance;
            this.setState({ selectedToken });
          }
        },
      }),
      POLL_DELAY_TOKENS,
    )();
  }

  async donateToDac(model, adminId, dacId, dacTitle, amount) {
    const amountDAC = parseFloat(amount - amount / 1.03)
      .toFixed(6)
      .toString();
    const amountMilestoneOwner = parseFloat(amount / 1.03)
      .toFixed(6)
      .toString();
    const { selectedToken } = this.state;
    const tokenSymbol = selectedToken.symbol;
    const { ownerAddress } = this.props.model;
    const isConfirmed = await React.swal({
      title: 'Twice as good!',
      content: React.swal.msg(
        <div>
          <p>For your donation you need to make 2 transactions:</p>
          <ol style={{ textAlign: 'left' }}>
            <li>
              The milestone owner decided to support the <b>{dacTitle}</b>! Woo-hoo! <br />{' '}
              <b>
                {amountDAC} {tokenSymbol}
              </b>{' '}
              will be delegated.
            </li>
            <li>
              The rest (
              <b>
                {amountMilestoneOwner} {tokenSymbol}
              </b>
              ) will go to the milestone owner.
            </li>
          </ol>
        </div>,
      ),
      icon: 'info',
      buttons: ['Cancel', 'Lets do it!'],
    });

    if (isConfirmed) {
      await this.donateWithBridge(
        model,
        dacId,
        amountDAC,
        adminId,
        amountMilestoneOwner,
        ownerAddress,
      );
    }
    this.setState({ isSaving: false });
  }

  async donateWithBridge(model, adminId, amount, adminIdTwo, amountTwo, ownerAddress) {
    const { currentUser } = this.props;
    const { givethBridge, etherscanUrl, showCustomAddress, selectedToken } = this.state;

    const value = utils.toWei(Number(amount).toFixed(18));
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    const tokenAddress = isDonationInToken ? selectedToken.address : ZERO_ADDRESS;

    const _makeDonationTx = async () => {
      let method;
      let donationUser;
      const opts = { from: currentUser.address, $extraGas: extraGas() };
      let customAddress = '';
      const { customAddress: modelAddress } = model;
      if (!ownerAddress) {
        customAddress = modelAddress;
      } else {
        customAddress = ownerAddress;
      }

      // actually uses 84766, but runs out of gas if exact
      if (!isDonationInToken) Object.assign(opts, { value, gas: DONATION_GAS });

      if (showCustomAddress || ownerAddress !== undefined) {
        // Donating on behalf of another user or address
        try {
          const user = await feathersClient.service('users').get(customAddress);
          if (user && user.giverId > 0) {
            method = givethBridge.donate(user.giverId, adminId, tokenAddress, value, opts);
            donationUser = user;
          } else {
            method = givethBridge.donateAndCreateGiver(
              customAddress,
              adminId,
              tokenAddress,
              value,
              opts,
            );
            donationUser = { address: customAddress };
          }
        } catch (e) {
          method = givethBridge.donateAndCreateGiver(
            customAddress,
            adminId,
            tokenAddress,
            value,
            opts,
          );
          donationUser = { address: customAddress };
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
          const closeDialog = adminIdTwo === undefined && amountTwo === undefined;
          if (!closeDialog) {
            if (showCustomAddress) {
              this.donateWithBridge(model, customAddress, amountTwo);
            } else {
              await this.setState({ showCustomAddress: false });
              this.donateWithBridge(model, adminIdTwo, amountTwo);
            }
          } else {
            await DonationService.newFeathersDonation(
              donationUser,
              this.props.model,
              value,
              selectedToken,
              txHash,
            );
          }

          this.setState({
            modalVisible: !closeDialog,
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
          if (closeDialog) this.closeDialog();
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
      const allowanceRequired = BigNumber.sum(
        value,
        amountTwo ? utils.toWei(Number(amountTwo).toFixed(18)) : '0',
      );
      DonationService.approveERC20tokenTransfer(
        tokenAddress,
        currentUser.address,
        allowanceRequired.toFixed(),
      )
        .then(async () => {
          await _makeDonationTx();
        })
        .catch(err => {
          this.setState({
            isSaving: false,
          });
          if (err.message !== 'cancelled') {
            ErrorPopup(
              'Something went wrong with your donation. Could not approve token allowance.',
              err,
            );
          } else {
            ErrorPopup('Something went wrong.', err);
          }
        });
    } else {
      await _makeDonationTx();
    }
  }

  render() {
    const {
      model,
      currentUser,
      NativeTokenBalance,
      isEnabled,
      validProvider,
      isCorrectNetwork,
      enableProvider,
    } = this.props;
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
        <button
          type="button"
          className="btn btn-success"
          onClick={() => {
            if (!isEnabled) {
              enableProvider();
            } else {
              this.openDialog();
            }
          }}
        >
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

            {validProvider && !currentUser && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like your Ethereum Provider is locked or you need to enable it.
              </div>
            )}
            {validProvider && currentUser && (
              <ActionNetworkWarning
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
            {isCorrectNetwork && validProvider && currentUser && (
              <Fragment>
                <span className="label">
                  How much {selectedToken.symbol} do you want to donate?
                </span>

                {validProvider && maxAmount.toNumber() !== 0 && balance.gt(0) && (
                  <div className="form-group">
                    <Slider
                      type="range"
                      name="amount2"
                      min={0}
                      max={maxAmount.toNumber()}
                      step={maxAmount.dividedBy(20).toNumber()}
                      value={Number(amount)}
                      labels={{
                        0: '0',
                        [maxAmount.toNumber()]: maxAmount.precision(6).toString(),
                      }}
                      tooltip={false}
                      onChange={newAmount => {
                        let result;

                        const roundedNumber = BigNumber(newAmount).toFixed(4, BigNumber.ROUND_DOWN);
                        if (maxAmount.gt(newAmount) && Number(roundedNumber) > 0) {
                          result = roundedNumber;
                        } else {
                          result = newAmount.toString();
                        }

                        return this.setState({ amount: result });
                      }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <Input
                    name="amount"
                    id="amount-input"
                    type="number"
                    value={amount}
                    onChange={(name, newAmount) => {
                      this.setState({
                        amount: newAmount,
                        defaultAmount: false,
                      });
                    }}
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
                      placeholder={ZERO_ADDRESS}
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
                {maxAmount.toNumber() !== 0 && balance !== '0' && (
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
              </Fragment>
            )}

            <button
              className="btn btn-light float-right"
              type="button"
              onClick={() => {
                this.closeDialog();
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
  dacId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
  acceptsSingleToken: PropTypes.bool,
  ownerAddress: PropTypes.string,
});

DonateButton.propTypes = {
  model: modelTypes.isRequired,
  currentUser: PropTypes.instanceOf(User),
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  NativeTokenBalance: PropTypes.instanceOf(BigNumber),
  validProvider: PropTypes.bool.isRequired,
  isEnabled: PropTypes.bool.isRequired,
  enableProvider: PropTypes.func.isRequired,
  isCorrectNetwork: PropTypes.bool.isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

DonateButton.defaultProps = {
  currentUser: undefined,
  NativeTokenBalance: new BigNumber(0),
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
};

export default props => (
  <WhiteListConsumer>
    {({ state: { activeTokenWhitelist } }) => (
      <Web3Consumer>
        {({
          state: { isHomeNetwork, isEnabled, validProvider, balance },
          actions: { enableProvider },
        }) => (
          <DonateButton
            NativeTokenBalance={balance}
            validProvider={validProvider}
            isCorrectNetwork={isHomeNetwork}
            tokenWhitelist={activeTokenWhitelist}
            isEnabled={isEnabled}
            enableProvider={enableProvider}
            {...props}
          />
        )}
      </Web3Consumer>
    )}
  </WhiteListConsumer>
);
