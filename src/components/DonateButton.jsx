// eslint-disable-next-line max-classes-per-file
import React, {
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Form, Input, Textarea } from 'formsy-react-components';
import Toggle from 'react-toggle';
import GA from 'lib/GoogleAnalytics';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import ReactTooltip from 'react-tooltip';
import { Button, Slider } from 'antd';
import getNetwork from '../lib/blockchain/getNetwork';
import extraGas from '../lib/blockchain/extraGas';
import pollEvery from '../lib/pollEvery';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import ErrorHandler from '../lib/ErrorHandler';

import config from '../configuration';
import DonationService from '../services/DonationService';
import DACService from '../services/DACService';
import { feathersClient } from '../lib/feathersClient';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import ActionNetworkWarning from './ActionNetworkWarning';
import SelectFormsy from './SelectFormsy';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import DAC from '../models/DAC';
import { convertEthHelper, ZERO_ADDRESS } from '../lib/helpers';
import NumericInput from './NumericInput';
import getWeb3 from '../lib/blockchain/getWeb3';
import ExchangeButton from './ExchangeButton';
import { checkProfileAfterDonation } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';

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
    minWidth: '40%',
    maxWidth: '80%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'auto',
    maxHeight: '64%',
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

const DonateButton = forwardRef((props, ref) => {
  const { model, autoPopup, afterSuccessfulDonate, className, match } = props;
  const {
    state: { tokenWhitelist },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isHomeNetwork, isEnabled, validProvider, balance: NativeTokenBalance },
    actions: { enableProvider },
  } = useContext(Web3Context);

  const isCorrectNetwork = isHomeNetwork;

  const tokenWhitelistOptions = tokenWhitelist.map(t => ({
    value: t.address,
    title: t.name,
  }));

  // set initial balance
  const modelToken = model.token || {};
  if (modelToken) modelToken.balance = new BigNumber(0);

  const defaultToken =
    tokenWhitelist.find(t => t.symbol === config.defaultDonateToken) || tokenWhitelist[0] || {};

  const [selectedToken, setSelectedToken] = useState(
    model.acceptsSingleToken ? modelToken : defaultToken,
  );
  const [isSaving, setSaving] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  const [amount, setAmount] = useState(
    selectedToken.symbol === config.nativeTokenName ? '1' : '100',
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [showCustomAddress, setShowCustomAddress] = useState(false);
  const [allowance, setAllowance] = useState(new BigNumber(0));
  const [allowanceStatus, setAllowanceStatus] = useState(AllowanceStatus.NotNeeded);

  const form = useRef();
  const givethBridge = useRef();
  const stopPolling = useRef();
  const allowanceApprovalType = useRef();

  const clearUp = () => {
    if (stopPolling.current) stopPolling.current();
  };

  const getMaxAmount = () => {
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

    let { maxDonationAmount } = props;
    if (maxDonationAmount) {
      if (dacId !== undefined && dacId !== 0) {
        maxDonationAmount *= 1.03;
      }
      maxAmount = maxAmount.gt(maxDonationAmount)
        ? new BigNumber(convertEthHelper(maxDonationAmount, selectedToken.decimals))
        : maxAmount;
    }

    return maxAmount;
  };

  const updateAllowance = (delay = 0) => {
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    if (!isDonationInToken) {
      setAllowance(new BigNumber(0));
      setAllowanceStatus(AllowanceStatus.NotNeeded);
    } else if (validProvider && currentUser.address) {
      // Fetch from network after 1 sec inorder to new allowance value be returned in response
      setTimeout(
        () =>
          DonationService.getERC20tokenAllowance(selectedToken.address, currentUser.address)
            .then(_allowance => {
              console.log('Allowance:', _allowance);
              setAllowance(new BigNumber(utils.fromWei(_allowance)));
            })
            .catch(() => {}),
        delay,
      );
    }
  };

  const pollToken = () => {
    // stop existing poll
    if (stopPolling.current) {
      stopPolling.current();
      stopPolling.current = undefined;
    }
    // Native token balance is provided by the Web3Provider

    stopPolling.current = pollEvery(
      () => ({
        request: async () => {
          try {
            if (selectedToken.symbol === config.nativeTokenName) {
              selectedToken.balance = new BigNumber(NativeTokenBalance);
              return selectedToken.balance;
            }

            const { tokens } = await getNetwork();
            const contract = tokens[selectedToken.address];

            // we are only interested in homeNetwork token balances
            if (!isCorrectNetwork || !currentUser.address || !contract) {
              return new BigNumber(0);
            }

            return new BigNumber(await contract.methods.balanceOf(currentUser.address).call());
          } catch (e) {
            return new BigNumber(0);
          }
        },
        onResult: balance => {
          if (balance && (!selectedToken.balance || !selectedToken.balance.eq(balance))) {
            setSelectedToken({ ...selectedToken, balance });
            const maxAmount = getMaxAmount();
            setAmount(
              maxAmount.lt(amount) ? convertEthHelper(maxAmount, selectedToken.decimals) : amount,
            );
          }
        },
      }),
      POLL_DELAY_TOKENS,
    )();
  };

  const setToken = address => {
    const token = tokenWhitelist.find(t => t.address === address);
    const { nativeTokenName } = config;
    if (!token.balance && token.symbol !== nativeTokenName) {
      token.balance = new BigNumber('0');
    } // FIXME: There should be a balance provider handling all of ..

    const balance = token.symbol === nativeTokenName ? NativeTokenBalance : token.balance;
    const defaultAmount = token.symbol === nativeTokenName ? '1' : '100';
    const newAmount = balance
      ? convertEthHelper(
          BigNumber.min(utils.fromWei(balance.toFixed()), defaultAmount),
          token.decimals,
        )
      : defaultAmount;
    setSelectedToken(token);
    setAmount(newAmount);
  };

  useEffect(() => {
    if (isHomeNetwork) {
      pollToken();
      updateAllowance();
    } else {
      clearUp();
    }
  }, [selectedToken, isHomeNetwork]);

  const updateAllowanceStatus = () => {
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    const { Needed, Enough, NotNeeded } = AllowanceStatus;

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

    setAllowanceStatus(newAllowanceStatus);
  };

  useEffect(() => {
    updateAllowanceStatus();
  }, [amount, allowance]);

  const toggleFormValid = state => {
    setFormIsValid(state);
  };

  const closeDialog = () => {
    const defaultAmount = selectedToken.symbol === config.nativeTokenName ? '1' : '100';
    const balance =
      selectedToken.symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;
    if (balance) {
      const newAmount = BigNumber.min(
        convertEthHelper(utils.fromWei(balance.toFixed()), selectedToken.decimals),
        defaultAmount,
      ).toFixed();
      setAmount(newAmount);
    }
    setModalVisible(false);
    setFormIsValid(false);
  };

  const canDonateToProject = () => {
    const { acceptsSingleToken, token } = model;
    return (
      !acceptsSingleToken ||
      tokenWhitelist.find(
        t => t.foreignAddress.toLocaleLowerCase() === token.foreignAddress.toLocaleLowerCase(),
      )
    );
  };

  const openDialog = () => {
    updateAllowance();

    if (!canDonateToProject()) {
      React.swal({
        title: 'Token is not Active to Donate',
        content: React.swal.msg(
          <div>
            <p>
              Token <strong>{model.token.symbol}</strong> cannot be directly donated anymore.
              <br />
              <strong>Delegate</strong> and <strong>Withdraw</strong> actions are still available
              for this token.
            </p>
          </div>,
        ),
      });
    } else {
      const { isCapped } = model;
      if (isCapped) {
        setAmount(getMaxAmount().toFixed());
      }
      setModalVisible(true);
      setFormIsValid(false);
    }
  };

  const doDonate = () => {
    if (!isEnabled) {
      enableProvider();
    }
    openDialog();
  };

  useEffect(() => {
    getNetwork().then(network => {
      givethBridge.current = network.givethBridge;
    });

    setTimeout(() => {
      if (autoPopup && match && typeof match.url === 'string' && match.url.endsWith('/donate')) {
        doDonate();
      }
    }, 1000);
    return clearUp;
  }, []);

  const donateWithBridge = async (
    adminId,
    _amount,
    donationOwnerAddress,
    allowanceAmount = 0,
    comment = '',
    _allowanceApprovalType = AllowanceApprovalType.Default,
  ) => {
    const { homeEtherscan: etherscanUrl } = config;
    const userAddress = currentUser.address;

    const amountWei = utils.toWei(new BigNumber(_amount).toFixed(18));
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    const tokenAddress = isDonationInToken ? selectedToken.address : ZERO_ADDRESS;

    const _makeDonationTx = async () => {
      let method;
      const opts = { from: userAddress, $extraGas: extraGas() };

      // actually uses 84766, but runs out of gas if exact
      if (!isDonationInToken) Object.assign(opts, { value: amountWei, gas: DONATION_GAS });

      let donationOwner;
      if (userAddress !== donationOwnerAddress) {
        // Donating on behalf of another user or address
        try {
          const user = await feathersClient.service('users').get(donationOwnerAddress);
          if (user && user.giverId > 0) {
            donationOwner = user;
            method = givethBridge.current.donate(
              user.giverId,
              adminId,
              tokenAddress,
              amountWei,
              opts,
            );
          } else {
            method = givethBridge.current.donateAndCreateGiver(
              donationOwnerAddress,
              adminId,
              tokenAddress,
              amountWei,
              opts,
            );
            donationOwner = { address: donationOwnerAddress };
          }
        } catch (e) {
          method = givethBridge.current.donateAndCreateGiver(
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
            ? givethBridge.current.donate(
                currentUser.giverId,
                adminId,
                tokenAddress,
                amountWei,
                opts,
              )
            : givethBridge.current.donateAndCreateGiver(
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
            const { nonce } = await web3.eth.getTransaction(transactionHash);
            txHash = transactionHash;

            await DonationService.newFeathersDonation(
              donationOwner,
              model,
              amountWei,
              selectedToken,
              txHash,
              nonce,
              comment,
            );

            resolve(true);
            closeDialog();

            if (isDonationInToken) {
              setTimeout(() => {
                setAllowance(allowance.minus(_amount));
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
            setSaving(false);

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
          .catch(err => {
            reject();

            const message = `Something went wrong with the transaction ${etherscanUrl}tx/${txHash} => ${err}`;
            ErrorHandler(err, message);

            setSaving(false);
            closeDialog();
          })
          .finally(() => updateAllowance(UPDATE_ALLOWANCE_DELAY));
      });
    };

    // if donating in token, first approve transfer of token by bridge
    if (isDonationInToken) {
      try {
        let allowanceRequired;
        if (_allowanceApprovalType === AllowanceApprovalType.Infinite) {
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
          () => updateAllowance(UPDATE_ALLOWANCE_DELAY),
        );

        // Maybe user has canceled the allowance approval transaction
        if (allowed) {
          setAllowanceStatus(AllowanceStatus.Enough);
          return _makeDonationTx();
        }
        return false;
      } catch (err) {
        setSaving(false);
        // error code 4001 means user has canceled the transaction
        let message;
        if (err.code !== 4001) {
          message = 'Something went wrong with your donation. Could not approve token allowance.';
        }

        ErrorHandler(err, message);
        return false;
      }
    } else {
      return _makeDonationTx();
    }
  };

  const donateToDac = async (
    adminId,
    dacId,
    _amount,
    donationOwnerAddress,
    _allowanceApprovalType,
    comment,
  ) => {
    const dac = await DACService.getByDelegateId(dacId);

    if (!dac) {
      ErrorPopup(`Dac not found!`);
      return false;
    }
    const { title: dacTitle } = dac;

    const amountDAC = parseFloat(_amount - _amount / 1.03)
      .toFixed(6)
      .toString();
    const amountMilestone = parseFloat(_amount / 1.03)
      .toFixed(6)
      .toString();
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
          await donateWithBridge(
            dacId,
            amountDAC,
            donationOwnerAddress,
            _amount,
            comment,
            _allowanceApprovalType,
          )
        )
          result = await donateWithBridge(
            adminId,
            amountMilestone,
            donationOwnerAddress,
            0,
            comment,
          );
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    setSaving(false);
    return result;
  };

  const submit = ({ customAddress, comment }) => {
    const { adminId, dacId } = model;

    const donationOwnerAddress = customAddress || currentUser.address;

    const afterDonate = success => {
      if (success) {
        afterSuccessfulDonate();
      }
    };

    if (allowanceApprovalType.current === AllowanceApprovalType.Clear) {
      DonationService.clearERC20TokenApproval(selectedToken.address, currentUser.address)
        .then(() => {
          setSaving(false);
          setAllowance(new BigNumber(0));
          setAllowanceStatus(AllowanceStatus.Needed);
        })
        .catch(err => {
          const message = `Something went wrong with the transaction`;
          ErrorHandler(err, message);

          setSaving(false);
          closeDialog();
        });
    } else if (dacId) {
      donateToDac(
        adminId,
        dacId,
        amount,
        donationOwnerAddress,
        allowanceApprovalType.current,
        comment,
      )
        .then(afterDonate)
        .catch(() => {});
    } else {
      donateWithBridge(
        adminId,
        amount,
        donationOwnerAddress,
        amount,
        comment,
        allowanceApprovalType.current,
      )
        .then(afterDonate)
        .catch(() => {});
    }

    setSaving(true);
  };

  const style = {
    display: 'inline-block',
  };

  const { decimals, symbol } = selectedToken;
  const balance = symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;
  const maxAmount = getMaxAmount();
  const zeroBalance = balance && balance.eq(0);

  const submitDefault = () => {
    allowanceApprovalType.current = AllowanceApprovalType.Default;
    form.current.formsyForm.submit();
  };

  const submitInfiniteAllowance = () => {
    React.swal({
      title: 'Infinite Allowance',
      text: `This will give the Giveth DApp permission to withdraw ${symbol} from your account and automate transactions for you.`,
      icon: 'success',
      buttons: ['Cancel', 'OK'],
    }).then(result => {
      if (result) {
        allowanceApprovalType.current = AllowanceApprovalType.Infinite;
        form.current.formsyForm.submit();
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
        allowanceApprovalType.current = AllowanceApprovalType.Clear;
        form.current.formsyForm.submit();
      }
    });
  };

  const capitalizeAdminType = type => type.charAt(0).toUpperCase() + type.slice(1);

  const sliderMarks = {
    0: '0',
  };
  sliderMarks[maxAmount.toNumber()] = maxAmount.toNumber();

  return (
    <span style={style}>
      <Button type="primary" onClick={doDonate} ref={ref} className={className}>
        Donate
      </Button>
      <Modal
        isOpen={modalVisible}
        onRequestClose={() => closeDialog()}
        shouldCloseOnOverlayClick={false}
        contentLabel={`Support this ${model.type}!`}
        style={modalStyles}
      >
        <Form
          onSubmit={submit}
          ref={form}
          mapping={inputs => ({
            amount: inputs.amount,
            customAddress: inputs.customAddress,
            comment: inputs.comment,
          })}
          onValid={() => toggleFormValid(true)}
          onInvalid={() => toggleFormValid(false)}
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

          {validProvider && !currentUser.address && (
            <div className="alert alert-warning">
              <i className="fa fa-exclamation-triangle" />
              It looks like your Ethereum Provider is locked or you need to enable it.
            </div>
          )}
          {validProvider && currentUser.address && (
            <ActionNetworkWarning
              incorrectNetwork={!isCorrectNetwork}
              networkName={config.homeNetworkName}
            />
          )}
          {isCorrectNetwork && currentUser.address && (
            <p>
              {model.type.toLowerCase() === DAC.type && (
                <span>
                  You&apos;re pledging: as long as the DAC owner does not lock your money you can
                  take it back any time.
                </span>
              )}
              {model.type.toLowerCase() !== DAC.type && (
                <span>
                  You&apos;re committing your funds to this {capitalizeAdminType(model.type)}, if
                  you have filled out contact information in your <Link to="/profile">Profile</Link>{' '}
                  you will be notified about how your funds are spent
                </span>
              )}
            </p>
          )}

          {validProvider && isCorrectNetwork && currentUser.address && (
            <div>
              {!model.acceptsSingleToken && (
                <SelectFormsy
                  name="token"
                  id="token-select"
                  label="Make your donation in"
                  helpText={`Select ${config.nativeTokenName} or the token you want to donate`}
                  value={selectedToken.address}
                  options={tokenWhitelistOptions}
                  onChange={address => setToken(address)}
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
          {isCorrectNetwork && validProvider && currentUser.address && (
            <Fragment>
              {!zeroBalance ? (
                <Fragment>
                  <span className="label">How much {symbol} do you want to donate?</span>

                  {validProvider && maxAmount.toNumber() !== 0 && balance.gt(0) && (
                    <div className="form-group" id="amount_slider">
                      <Slider
                        min={0}
                        max={maxAmount.toNumber()}
                        onChange={num => setAmount(num.toString())}
                        value={amount}
                        step={decimals ? 1 / 10 ** decimals : 1}
                        marks={sliderMarks}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <NumericInput
                      token={selectedToken}
                      maxAmount={maxAmount}
                      id="amount-input"
                      value={amount}
                      onChange={setAmount}
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
                      onChange={() => setShowCustomAddress(!showCustomAddress)}
                    />
                    <div className="label">I want to donate on behalf of another address</div>
                  </div>
                  {showCustomAddress && (
                    <div className="form-group recipient-address-container">
                      <Input
                        name="customAddress"
                        id="title-input"
                        type="text"
                        value={currentUser.address}
                        placeholder={ZERO_ADDRESS}
                        validations="isEtherAddress"
                        validationErrors={{
                          isEtherAddress: 'Please insert a valid Ethereum address.',
                        }}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <Textarea name="comment" id="comment-input" value="" placeholder="Comment" />
                  </div>
                  <div>
                    <br />
                    <br />
                  </div>
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
                      data-tip="React-tooltip"
                    >
                      <i className="fa fa-unlock-alt" /> Infinite Unlock & Donate
                    </LoaderButton>
                  )}

                  <ReactTooltip place="top" type="dark" effect="solid">
                    <p style={{ maxWidth: 250 }}>
                      Infinite unlock will allow the Giveth Bridge smart contract to interact freely
                      with the {selectedToken.name} in your wallet, this can be changed later by
                      clicking Donate and choosing to Revoke unlike your bank irl.. hehehehe
                    </p>
                  </ReactTooltip>

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
              closeDialog();
            }}
          >
            Close
          </button>
        </Form>
      </Modal>
    </span>
  );
});

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
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  afterSuccessfulDonate: PropTypes.func,
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }),
  autoPopup: PropTypes.bool,
  className: PropTypes.string,
};

DonateButton.defaultProps = {
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
  afterSuccessfulDonate: () => {},
  match: undefined,
  autoPopup: false,
  className: '',
};

const DonateButtonWithRouter = withRouter(React.memo(DonateButton));

const Root = props => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const defaultDacDonateButton = useRef();

  const [defaultDacModel, setDefaultDacModel] = useState(undefined);

  const { model, className } = props;

  useEffect(() => {
    const { defaultDacId } = config;
    if (defaultDacId) {
      if (model.type !== DAC.type || Number(model.adminId) !== defaultDacId) {
        DACService.getByDelegateId(defaultDacId).then(defaultDac => {
          if (defaultDac) {
            const dacModel = {
              type: DAC.type,
              title: defaultDac.title,
              id: defaultDac.id,
              token: { symbol: config.nativeTokenName },
              adminId: defaultDac.delegateId,
            };

            setDefaultDacModel(dacModel);
          }
        });
      }
    }
  }, []);

  const { customThanksMessage } = model;
  const afterSuccessfulDonate = () => {
    const el = document.createElement('div');
    el.innerHTML = customThanksMessage;

    if (!currentUser || currentUser.name) {
      // known user
      if (typeof customThanksMessage !== 'undefined') {
        // Custom Thanks
        React.swal({
          title: 'Thank you!',
          content: el,
          icon: 'success',
          buttons: 'OK',
        });
      } else if (defaultDacModel) {
        // Thanks and Donate to Defualt DAC suggestion
        React.swal({
          title: 'Thank you!',
          text: 'Would you like to support Giveth as well?',
          icon: 'success',
          buttons: ['No Thanks', 'Support Giveth'],
        }).then(result => {
          if (result) {
            defaultDacDonateButton.current.click();
          }
        });
      } else {
        // Simple Thanks
        React.swal({
          title: 'Thank you!',
          icon: 'success',
          buttons: 'OK',
        });
      }
    } else {
      //  Thanks for anon user (without profile) Register Suggestion
      checkProfileAfterDonation(currentUser);
    }
  };
  const afterSuccessfulDonateMemorized = useCallback(afterSuccessfulDonate, [
    currentUser,
    defaultDacModel,
    customThanksMessage,
  ]);

  return (
    <Fragment>
      <DonateButtonWithRouter afterSuccessfulDonate={afterSuccessfulDonateMemorized} {...props} />
      {defaultDacModel && (
        <div style={{ display: 'none' }}>
          <DonateButton
            model={defaultDacModel}
            ref={defaultDacDonateButton}
            autoPopup={false}
            className={className}
          />
        </div>
      )}
    </Fragment>
  );
};

Root.propTypes = {
  model: modelTypes.isRequired,
  autoPopup: PropTypes.bool,
  className: PropTypes.string,
};

Root.defaultProps = {
  autoPopup: false,
  className: '',
};

export default React.memo(Root);
