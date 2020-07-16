// eslint-disable-next-line max-classes-per-file
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import Toggle from 'react-toggle';
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
import { convertEthHelper, ZERO_ADDRESS } from '../lib/helpers';
import RangeSlider from './RangeSlider';
import NumericInput from './NumericInput';
import getWeb3 from '../lib/blockchain/getWeb3';
import ExchangeButton from './ExchangeButton';

const POLL_DELAY_TOKENS = 2000;
const UPDATE_ALLOWANCE_DELAY = 1000; // Delay allowance update inorder to network respond new value

const INFINITE_ALLOWANCE = new BigNumber(2)
  .pow(256)
  .minus(1)
  .toFixed();

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

const AllowanceStatus = {
  NotNeeded: 1, // Token doesn't need allowance approval
  Enough: 2, // Allowance amount is enough
  Needed: 3, // Allowance approval is needed
};

const AllowanceApprovalType = {
  Default: 1,
  Infinite: 2,
  Clear: 3, // Set allowance to zero
};

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
      amount: selectedToken.symbol === config.nativeTokenName ? '1' : '100',
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
      allowance: new BigNumber(0),
      allowanceStatus: AllowanceStatus.NotNeeded,
      allowanceApprovalType: undefined,
    };

    this.form = React.createRef();
    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
    this.updateAllowance = this.updateAllowance.bind(this);
    this.updateAllowanceStatus = this.updateAllowanceStatus.bind(this);
  }

  componentDidMount() {
    getNetwork().then(network => {
      this.setState({
        givethBridge: network.givethBridge,
        etherscanUrl: network.homeEtherscan,
      });
    });
    this.pollToken();
    this.updateAllowance();
  }

  componentWillUnmount() {
    if (this.stopPolling) this.stopPolling();
  }

  setToken(address) {
    const token = this.props.tokenWhitelist.find(t => t.address === address);
    const { NativeTokenBalance } = this.props;
    const { nativeTokenName } = config;
    if (!token.balance && token.symbol !== nativeTokenName) {
      token.balance = new BigNumber('0');
    } // FIXME: There should be a balance provider handling all of this...

    const balance = token.symbol === nativeTokenName ? NativeTokenBalance : token.balance;
    const defaultAmount = token.symbol === nativeTokenName ? '1' : '100';
    const newAmount = balance
      ? convertEthHelper(
          BigNumber.min(utils.fromWei(balance.toFixed()), defaultAmount),
          token.decimals,
        )
      : defaultAmount;
    this.setState(
      {
        selectedToken: token,
        amount: newAmount,
      },
      () => {
        this.pollToken();
        this.updateAllowance();
      },
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
      maxAmount = new BigNumber(convertEthHelper(maxFromWei, selectedToken.decimals));
    }

    let { maxDonationAmount } = this.props;
    if (maxDonationAmount) {
      if (dacId !== undefined && dacId !== 0) {
        maxDonationAmount *= 1.03;
      }
      maxAmount = maxAmount.gt(maxDonationAmount)
        ? new BigNumber(convertEthHelper(maxDonationAmount, selectedToken.decimals))
        : maxAmount;
    }

    return maxAmount;
  }

  updateAllowanceStatus() {
    const { selectedToken } = this.state;
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    const { Needed, Enough, NotNeeded } = AllowanceStatus;
    const { allowance, amount } = this.state;

    const amountNumber = new BigNumber(amount);
    let newAllowanceStatus;
    if (isDonationInToken) {
      if (allowance.isZero() || allowance.lt(amountNumber)) {
        newAllowanceStatus = Needed;
      } else {
        newAllowanceStatus = Enough;
      }
    } else {
      newAllowanceStatus = NotNeeded;
    }

    this.setState({
      allowanceStatus: newAllowanceStatus,
    });
  }

  updateAllowance(delay = 0) {
    const { selectedToken } = this.state;

    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    if (!isDonationInToken) {
      this.setState({
        allowance: new BigNumber(0),
        allowanceStatus: AllowanceStatus.NotNeeded,
      });
    } else {
      const { currentUser, validProvider } = this.props;
      if (validProvider && currentUser) {
        // Fetch from network after 1 sec inorder to new allowance value be returned in response
        setTimeout(
          () =>
            DonationService.getERC20tokenAllowance(selectedToken.address, currentUser.address)
              .then(allowance => {
                this.setState(
                  {
                    allowance: new BigNumber(utils.fromWei(allowance)),
                  },
                  this.updateAllowanceStatus,
                );
              })
              .catch(() => {}),
          delay,
        );
      }
    }
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  closeDialog() {
    const { selectedToken } = this.state;
    const { NativeTokenBalance } = this.props;
    const { nativeTokenName } = config;

    const defaultAmount = selectedToken.symbol === config.nativeTokenName ? '1' : '100';
    const balance =
      selectedToken.symbol === nativeTokenName ? NativeTokenBalance : selectedToken.balance;
    const amount = BigNumber.min(
      convertEthHelper(utils.fromWei(balance.toFixed()), selectedToken.decimals),
      defaultAmount,
    ).toFixed();
    this.setState({
      modalVisible: false,
      amount,
      formIsValid: false,
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
    this.updateAllowance();

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
          formIsValid: false,
        };
      });
    }
  }

  submit({ amount, customAddress }) {
    const { model, currentUser, afterSuccessfulDonate } = this.props;
    const { adminId, dacId } = model;
    const { allowanceApprovalType, selectedToken } = this.state;

    const donationOwnerAddress = customAddress || currentUser.address;

    const afterDonate = success => {
      this.updateAllowance(UPDATE_ALLOWANCE_DELAY);
      if (success) afterSuccessfulDonate();
    };

    if (allowanceApprovalType === AllowanceApprovalType.Clear) {
      DonationService.clearERC20TokenApproval(selectedToken.address, currentUser.address)
        .then(() => {
          this.setState(
            {
              isSaving: false,
              allowance: new BigNumber(0),
              allowanceStatus: AllowanceStatus.Needed,
            },
            () => this.updateAllowance(UPDATE_ALLOWANCE_DELAY),
          );
        })
        .catch(e => {
          if (!e.message.includes('User denied transaction signature')) {
            ErrorPopup('Something went wrong with your transaction.');
          } else {
            React.toast.info('The transaction was cancelled. :-(');
          }
          this.setState({
            isSaving: false,
          });
          this.closeDialog();
        });
    } else if (dacId) {
      this.donateToDac(adminId, dacId, amount, donationOwnerAddress, allowanceApprovalType)
        .then(afterDonate)
        .catch(() => afterDonate(false));
    } else {
      this.donateWithBridge(adminId, amount, donationOwnerAddress, amount, allowanceApprovalType)
        .then(afterDonate)
        .catch(() => afterDonate(false));
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
          if (
            balance &&
            (selectedToken.symbol === config.nativeTokenName ||
              !selectedToken.balance ||
              !selectedToken.balance.eq(balance))
          ) {
            selectedToken.balance = balance;
            this.setState({ selectedToken }, () => {
              const { amount } = this.state;
              const maxAmount = this.getMaxAmount();
              this.setState(
                {
                  amount: maxAmount.lt(amount)
                    ? convertEthHelper(maxAmount, selectedToken.decimals)
                    : amount,
                },
                this.updateAllowanceStatus,
              );
            });
          }
        },
      }),
      POLL_DELAY_TOKENS,
    )();
  }

  async donateToDac(adminId, dacId, amount, donationOwnerAddress, allowanceApprovalType) {
    const dac = await DACService.getByDelegateId(dacId);

    if (!dac) {
      ErrorPopup(`Dac not found!`);
      return false;
    }
    const { title: dacTitle } = dac;

    const amountDAC = parseFloat(amount - amount / 1.03)
      .toFixed(6)
      .toString();
    const amountMilestone = parseFloat(amount / 1.03)
      .toFixed(6)
      .toString();
    const { selectedToken } = this.state;
    const tokenSymbol = selectedToken.symbol;
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
                {amountMilestone} {tokenSymbol}
              </b>
              ) will go to the milestone owner.
            </li>
          </ol>
        </div>,
      ),
      icon: 'info',
      buttons: ['Cancel', 'Lets do it!'],
    });

    let result = false;
    if (isConfirmed) {
      try {
        if (
          await this.donateWithBridge(
            dacId,
            amountDAC,
            donationOwnerAddress,
            amount,
            allowanceApprovalType,
          )
        )
          result = await this.donateWithBridge(adminId, amountMilestone, donationOwnerAddress);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.setState({ isSaving: false });
    return result;
  }

  async donateWithBridge(
    adminId,
    amount,
    donationOwnerAddress,
    allowanceAmount = 0,
    allowanceApprovalType = AllowanceApprovalType.Default,
  ) {
    const { currentUser } = this.props;
    const { givethBridge, etherscanUrl, selectedToken } = this.state;

    const amountWei = utils.toWei(new BigNumber(amount).toFixed(18));
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    const tokenAddress = isDonationInToken ? selectedToken.address : ZERO_ADDRESS;

    const _makeDonationTx = async () => {
      let method;
      const opts = { from: currentUser.address, $extraGas: extraGas() };

      // actually uses 84766, but runs out of gas if exact
      if (!isDonationInToken) Object.assign(opts, { value: amountWei, gas: DONATION_GAS });

      let donationOwner;
      if (currentUser.address !== donationOwnerAddress) {
        // Donating on behalf of another user or address
        try {
          const user = await feathersClient.service('users').get(donationOwnerAddress);
          if (user && user.giverId > 0) {
            donationOwner = user;
            method = givethBridge.donate(user.giverId, adminId, tokenAddress, amountWei, opts);
          } else {
            method = givethBridge.donateAndCreateGiver(
              donationOwnerAddress,
              adminId,
              tokenAddress,
              amountWei,
              opts,
            );
            donationOwner = { address: donationOwnerAddress };
          }
        } catch (e) {
          method = givethBridge.donateAndCreateGiver(
            donationOwnerAddress,
            adminId,
            tokenAddress,
            amountWei,
            opts,
          );
          donationOwner = { address: donationOwnerAddress };
        }
      } else {
        // Donating on behalf of logged in DApp user
        method =
          currentUser.giverId > 0
            ? givethBridge.donate(currentUser.giverId, adminId, tokenAddress, amountWei, opts)
            : givethBridge.donateAndCreateGiver(
                currentUser.address,
                adminId,
                tokenAddress,
                amountWei,
                opts,
              );
        donationOwner = currentUser;
      }

      return new Promise((resolve, reject) => {
        let txHash;
        method
          .on('transactionHash', async transactionHash => {
            const web3 = await getWeb3();
            const txNonce = await web3.eth.getTransactionCount(currentUser.address, 'pending');
            txHash = transactionHash;

            await DonationService.newFeathersDonation(
              donationOwner,
              this.props.model,
              amountWei,
              selectedToken,
              txHash,
              txNonce,
            );

            resolve(true);
            this.closeDialog();

            if (isDonationInToken) {
              setTimeout(() => {
                this.setState(prevState => {
                  const { allowance } = prevState;
                  return { allowance: allowance.minus(amount) };
                });
              }, UPDATE_ALLOWANCE_DELAY);
            }

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
            this.updateAllowance(UPDATE_ALLOWANCE_DELAY);

            this.setState({
              isSaving: false,
            });

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
            reject();
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
            this.closeDialog();
          });
      });
    };

    // if donating in token, first approve transfer of token by bridge
    if (isDonationInToken) {
      try {
        let allowanceRequired;
        if (allowanceApprovalType === AllowanceApprovalType.Infinite) {
          allowanceRequired = INFINITE_ALLOWANCE;
        } else {
          allowanceRequired = allowanceAmount
            ? utils.toWei(new BigNumber(allowanceAmount).toFixed(18))
            : amountWei;
        }
        const allowed = await DonationService.approveERC20tokenTransfer(
          tokenAddress,
          currentUser.address,
          allowanceRequired.toString(),
        );

        // Allowance value may have changed
        this.updateAllowance(UPDATE_ALLOWANCE_DELAY);

        // Maybe user has canceled the allowance approval transaction
        if (allowed) {
          this.setState({ allowanceStatus: AllowanceStatus.Enough });
          return _makeDonationTx();
        }
        return false;
      } catch (err) {
        this.setState({
          isSaving: false,
        });
        // error code 4001 means user has canceled the transaction
        if (err.code !== 4001) {
          ErrorPopup(
            'Something went wrong with your donation. Could not approve token allowance.',
            err,
          );
        }
        return false;
      }
    } else {
      return _makeDonationTx();
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
      allowanceStatus,
    } = this.state;

    const style = {
      display: 'inline-block',
    };

    const { decimals, symbol } = selectedToken;
    const balance = symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;
    const maxAmount = this.getMaxAmount();
    const zeroBalance = balance && balance.eq(0);

    const submitDefault = () => {
      this.setState(
        {
          allowanceApprovalType: AllowanceApprovalType.Default,
        },
        () => this.form.current.formsyForm.submit(),
      );
    };

    const submitInfiniteAllowance = () => {
      React.swal({
        title: 'Infinite Allowance',
        text: `This will give the Giveth DApp permission to withdraw ${symbol} from your account and automate transactions for you.`,
        icon: 'success',
        buttons: ['Cancel', 'OK'],
      }).then(result => {
        if (result) {
          this.setState(
            {
              allowanceApprovalType: AllowanceApprovalType.Infinite,
            },
            () => this.form.current.formsyForm.submit(),
          );
        }
      });
    };

    const submitClearAllowance = () => {
      React.swal({
        title: `Take away ${symbol} Allowance`,
        text: `Do you want to set DApp allowance of ${symbol} token to zero?`,
        icon: 'info',
        buttons: ['Cancel', 'Yes'],
      }).then(result => {
        if (result) {
          this.setState(
            {
              allowanceApprovalType: AllowanceApprovalType.Clear,
            },
            () => this.form.current.formsyForm.submit(),
          );
        }
      });
    };

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
            ref={this.form}
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
                {zeroBalance ? (
                  <Fragment>
                    You don&apos;t have any {symbol} token!
                    <br />
                    <br />
                    <br />
                    <br />
                  </Fragment>
                ) : (
                  <Fragment>
                    {config.homeNetworkName} {symbol} balance:&nbsp;
                    <em>
                      {convertEthHelper(utils.fromWei(balance ? balance.toFixed() : ''), decimals)}
                    </em>
                  </Fragment>
                )}
              </div>
            )}
            {isCorrectNetwork && validProvider && currentUser && (
              <Fragment>
                {!zeroBalance ? (
                  <Fragment>
                    <span className="label">How much {symbol} do you want to donate?</span>

                    {validProvider && maxAmount.toNumber() !== 0 && balance.gt(0) && (
                      <div className="form-group">
                        <RangeSlider
                          onChange={newAmount => {
                            this.setState({ amount: newAmount }, this.updateAllowanceStatus);
                          }}
                          token={selectedToken}
                          value={amount}
                          maxAmount={maxAmount}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <NumericInput
                        token={selectedToken}
                        maxAmount={maxAmount}
                        id="amount-input"
                        value={amount}
                        onChange={newAmount =>
                          this.setState(
                            {
                              amount: newAmount,
                            },
                            this.updateAllowanceStatus,
                          )
                        }
                        autoFocus
                        lteMessage={`This donation exceeds your wallet balance or the Milestone max amount: ${convertEthHelper(
                          maxAmount,
                          decimals,
                        )} ${symbol}.`}
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
                  </Fragment>
                ) : null}
                {maxAmount.toNumber() !== 0 && (
                  <Fragment>
                    <LoaderButton
                      className="btn btn-success"
                      formNoValidate
                      disabled={isSaving || !formIsValid || !isCorrectNetwork}
                      isLoading={false}
                      onClick={submitDefault}
                    >
                      {allowanceStatus !== AllowanceStatus.Needed ? 'Donate' : 'Unlock & Donate'}
                    </LoaderButton>

                    {allowanceStatus === AllowanceStatus.Needed && (
                      <LoaderButton
                        type="button"
                        className="btn btn-primary ml-2"
                        formNoValidate
                        disabled={isSaving || !formIsValid || !isCorrectNetwork}
                        isLoading={false}
                        onClick={submitInfiniteAllowance}
                      >
                        <i className="fa fa-unlock-alt" /> Infinite Unlock & Donate
                      </LoaderButton>
                    )}

                    {allowanceStatus === AllowanceStatus.Enough && (
                      <LoaderButton
                        className="btn btn-danger ml-2"
                        formNoValidate
                        disabled={isSaving || !isCorrectNetwork}
                        isLoading={false}
                        onClick={submitClearAllowance}
                      >
                        <i className="fa fa-lock" /> Remove Approval
                      </LoaderButton>
                    )}
                  </Fragment>
                )}
              </Fragment>
            )}
            <span className={zeroBalance ? '' : 'ml-2'}>
              <ExchangeButton />
            </span>
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
  afterSuccessfulDonate: PropTypes.func,
};

DonateButton.defaultProps = {
  currentUser: undefined,
  NativeTokenBalance: new BigNumber(0),
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
  afterSuccessfulDonate: () => {},
};

export default class Root extends React.PureComponent {
  constructor(props) {
    super(props);

    this.defaultDacDonateButton = React.createRef();
    this.state = {
      donateToDefaultDac: false,
      defaultDacModel: undefined,
    };

    this.afterSuccessfulDonate = this.afterSuccessfulDonate.bind(this);
  }

  componentDidMount() {
    const { defaultDacId } = config;
    if (defaultDacId) {
      const { model } = this.props;
      if (model.type !== DAC.type || Number(model.adminId) !== defaultDacId) {
        DACService.getByDelegateId(defaultDacId).then(defaultDac => {
          if (defaultDac) {
            const defaultDacModel = {
              type: DAC.type,
              title: defaultDac.title,
              id: defaultDac.id,
              token: { symbol: config.nativeTokenName },
              adminId: defaultDac.delegateId,
            };

            this.setState({
              donateToDefaultDac: true,
              defaultDacModel,
            });
          }
        });
      }
    }
  }

  afterSuccessfulDonate() {
    const { donateToDefaultDac } = this.state;
    if (donateToDefaultDac) {
      React.swal({
        title: 'Thank you!',
        text: 'Would you like to support Giveth as well?',
        icon: 'success',
        buttons: ['No Thanks', 'Support Giveth'],
      }).then(result => {
        if (result) {
          this.defaultDacDonateButton.current.openDialog();
        }
      });
    }
  }

  render() {
    const { donateToDefaultDac, defaultDacModel } = this.state;
    return (
      <WhiteListConsumer>
        {({ state: { activeTokenWhitelist } }) => (
          <Web3Consumer>
            {({
              state: { isHomeNetwork, isEnabled, validProvider, balance },
              actions: { enableProvider },
            }) => (
              <Fragment>
                <DonateButton
                  NativeTokenBalance={balance}
                  validProvider={validProvider}
                  isCorrectNetwork={isHomeNetwork}
                  tokenWhitelist={activeTokenWhitelist}
                  isEnabled={isEnabled}
                  enableProvider={enableProvider}
                  afterSuccessfulDonate={this.afterSuccessfulDonate}
                  {...this.props}
                />
                {donateToDefaultDac && (
                  <div style={{ display: 'none' }}>
                    <DonateButton
                      NativeTokenBalance={balance}
                      validProvider={validProvider}
                      isCorrectNetwork={isHomeNetwork}
                      tokenWhitelist={activeTokenWhitelist}
                      isEnabled={isEnabled}
                      enableProvider={enableProvider}
                      model={defaultDacModel}
                      currentUser={this.props.currentUser}
                      ref={this.defaultDacDonateButton}
                    />
                  </div>
                )}
              </Fragment>
            )}
          </Web3Consumer>
        )}
      </WhiteListConsumer>
    );
  }
}

Root.propTypes = {
  model: modelTypes.isRequired,
  currentUser: PropTypes.instanceOf(User),
};

Root.defaultProps = {
  currentUser: undefined,
};
