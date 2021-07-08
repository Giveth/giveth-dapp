/* eslint-disable react/prop-types */
// eslint-disable-next-line max-classes-per-file
import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Slider, Form, Select, Input, InputNumber, Checkbox } from 'antd';

import getNetwork from '../lib/blockchain/getNetwork';
import extraGas from '../lib/blockchain/extraGas';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import ErrorHandler from '../lib/ErrorHandler';

import config from '../configuration';
import DonationBlockchainService from '../services/DonationBlockchainService';
import CommunityService from '../services/CommunityService';
import { feathersClient } from '../lib/feathersClient';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as NotificationContext } from '../contextProviders/NotificationModalProvider';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import ActionNetworkWarning from './ActionNetworkWarning';
import Community from '../models/Community';
import { convertEthHelper, ZERO_ADDRESS } from '../lib/helpers';
import getWeb3 from '../lib/blockchain/getWeb3';
import ExchangeButton from './ExchangeButton';
import pollEvery from '../lib/pollEvery';
import AmountSliderMarks from './AmountSliderMarks';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';

const UPDATE_ALLOWANCE_DELAY = 1000; // Delay allowance update inorder to network respond new value
const POLL_DELAY_TOKENS = 2000;

const INFINITE_ALLOWANCE = new BigNumber(2)
  .pow(256)
  .minus(1)
  .toFixed();

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

const DonateButtonModal = props => {
  const { model, setModalVisible, customThanksMessage } = props;
  const {
    state: { tokenWhitelist },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isHomeNetwork, validProvider, balance: NativeTokenBalance },
  } = useContext(Web3Context);
  const {
    actions: { donationPending, donationSuccessful, donationFailed },
  } = useContext(NotificationContext);

  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);
  const isCorrectNetwork = isHomeNetwork;

  const tokenWhitelistOptions = useMemo(
    () =>
      tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
    [tokenWhitelist],
  );

  // set initial balance
  const modelToken = useMemo(() => {
    const t = model.token || {};
    t.balance = new BigNumber(0);
    return { ...t };
  }, [model]);

  const defaultToken = useMemo(
    () =>
      tokenWhitelist.find(t => t.symbol === config.defaultDonateToken) || tokenWhitelist[0] || {},
    [tokenWhitelist],
  );
  const [selectedToken, setSelectedToken] = useState({});
  const [isSaving, setSaving] = useState(false);
  const [amount, setAmount] = useState('0');
  const [showCustomAddress, setShowCustomAddress] = useState(false);
  const [allowance, setAllowance] = useState(new BigNumber(0));
  const [allowanceStatus, setAllowanceStatus] = useState(AllowanceStatus.NotNeeded);
  const [contentVisible, setContentVisible] = useState(false);
  const [customAddress, setCustomAddress] = useState();
  const [formIsValid, setFormIsValid] = useState(true);
  const [donationComment, setDonationComment] = useState('');

  const form = useRef();
  const givethBridge = useRef();
  const stopPolling = useRef();
  const allowanceApprovalType = useRef();

  useEffect(() => {
    setSelectedToken(model.acceptsSingleToken ? modelToken : defaultToken);
  }, [model, defaultToken]);

  const clearUp = () => {
    if (stopPolling.current) stopPolling.current();
  };

  const getMaxAmount = useCallback(() => {
    const { communityId } = model;

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
      if (communityId !== undefined && communityId !== 0) {
        maxDonationAmount *= 1.03;
      }
      maxAmount = maxAmount.gt(maxDonationAmount)
        ? new BigNumber(convertEthHelper(maxDonationAmount, selectedToken.decimals))
        : maxAmount;
    }

    return maxAmount;
  }, [selectedToken, model, props, NativeTokenBalance]);

  const updateAllowance = (delay = 0) => {
    const isDonationInToken = selectedToken.symbol !== config.nativeTokenName;
    if (!isDonationInToken) {
      setAllowance(new BigNumber(0));
      setAllowanceStatus(AllowanceStatus.NotNeeded);
    } else if (validProvider && currentUser.address) {
      // Fetch from network after 1 sec inorder to new allowance value be returned in response
      setTimeout(
        () =>
          DonationBlockchainService.getERC20tokenAllowance(
            selectedToken.address,
            currentUser.address,
          )
            .then(_allowance => {
              console.log('Allowance:', _allowance);
              setAllowance(new BigNumber(utils.fromWei(_allowance)));
            })
            .catch(() => {}),
        delay,
      );
    }
  };

  const setToken = useCallback(
    address => {
      const token = tokenWhitelist.find(t => t.address === address);
      const { nativeTokenName } = config;
      if (!token.balance && token.symbol !== nativeTokenName) {
        token.balance = new BigNumber('0');
      } // FIXME: There should be a balance provider handling all of ..
      const defaultAmount = '0';
      setSelectedToken(token);
      setAmount(defaultAmount);
    },
    [tokenWhitelist, NativeTokenBalance],
  );

  const updateAllowanceStatus = useCallback(() => {
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
  }, [selectedToken, allowance, amount]);

  const pollToken = useCallback(() => {
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
  }, [
    NativeTokenBalance,
    amount,
    currentUser.address,
    getMaxAmount,
    isCorrectNetwork,
    selectedToken,
  ]);

  useEffect(() => {
    updateAllowanceStatus();
  }, [amount, allowance, updateAllowanceStatus]);

  useEffect(() => {
    if (isHomeNetwork) {
      pollToken();
      updateAllowance();
    } else {
      clearUp();
    }
  }, [selectedToken, isHomeNetwork, currentUser]);

  const canDonateToProject = useCallback(() => {
    const { acceptsSingleToken, token } = model;
    return (
      !acceptsSingleToken ||
      tokenWhitelist.find(
        // eslint-disable-next-line react/prop-types
        t => t.foreignAddress.toLocaleLowerCase() === token.foreignAddress.toLocaleLowerCase(),
      )
    );
  }, [model, tokenWhitelist]);

  useEffect(() => {
    getNetwork().then(network => {
      givethBridge.current = network.givethBridge;
    });

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
      setContentVisible(true);
    }

    return clearUp;
  }, [canDonateToProject, model]);

  /**
   *
   * @param toAdmin
   * {
   *    adminId:number,
   *    id:string <entityId>,
   *    type: community | trace | campaign
   *    campaignId ?: it's filled for traces
   * }
   * @param _amount
   * @param donationOwnerAddress
   * @param allowanceAmount
   * @param comment
   * @param _allowanceApprovalType
   * @returns {Promise<unknown>}
   */
  const donateWithBridge = async (
    toAdmin,
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
              toAdmin.adminId,
              tokenAddress,
              amountWei,
              opts,
            );
          } else {
            method = givethBridge.current.donateAndCreateGiver(
              donationOwnerAddress,
              toAdmin.adminId,
              tokenAddress,
              amountWei,
              opts,
            );
            donationOwner = { address: donationOwnerAddress };
          }
        } catch (e) {
          method = givethBridge.current.donateAndCreateGiver(
            donationOwnerAddress,
            toAdmin.adminId,
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
                toAdmin.adminId,
                tokenAddress,
                amountWei,
                opts,
              )
            : givethBridge.current.donateAndCreateGiver(
                currentUser.address,
                toAdmin.adminId,
                tokenAddress,
                amountWei,
                opts,
              );
        donationOwner = currentUser;
      }

      return new Promise((resolve, reject) => {
        let txHash;
        let txUrl;
        method
          .on('transactionHash', async transactionHash => {
            const web3 = await getWeb3();
            const { nonce } = await web3.eth.getTransaction(transactionHash);
            txHash = transactionHash;

            await DonationBlockchainService.newFeathersDonation(
              donationOwner,
              toAdmin,
              amountWei,
              selectedToken,
              txHash,
              nonce,
              comment,
            );

            resolve(true);
            setModalVisible(false);

            if (isDonationInToken) {
              setTimeout(() => {
                setAllowance(allowance.minus(_amount));
              }, UPDATE_ALLOWANCE_DELAY);
            }

            txUrl = `${etherscanUrl}tx/${txHash}`;

            sendAnalyticsTracking('Donated', {
              category: 'Donation',
              action: 'donated',
              url: txUrl,
              userAddress,
              donationOwnerAddress,
              to: toAdmin,
              amount: _amount,
              token: selectedToken,
            });

            donationPending(txUrl);
          })
          .then(() => {
            setSaving(false);
            donationSuccessful(txUrl, customThanksMessage);
          })
          .catch(err => {
            reject();

            if (txHash === undefined) {
              if (err.code === 4001) {
                sendAnalyticsTracking('Rejected Donation', {
                  action: 'donated',
                  userAddress,
                  donationOwnerAddress,
                  to: toAdmin,
                  amount: _amount,
                  token: selectedToken,
                });
                donationFailed(null, 'User denied transaction signature');
              } else {
                donationFailed(
                  null,
                  "MetaMask couldn't get transaction receipt, but probably donation will go through",
                );
              }
            } else {
              donationFailed(txUrl);
            }

            setSaving(false);
            setModalVisible(false);
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
        const allowed = await DonationBlockchainService.approveERC20tokenTransfer(
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

  const donateToCommunity = async (
    adminId,
    communityId,
    _amount,
    donationOwnerAddress,
    _allowanceApprovalType,
    comment,
  ) => {
    const community = await CommunityService.getByDelegateId(communityId);

    if (!community) {
      ErrorPopup(`Community not found!`);
      return false;
    }
    const { title: communityTitle } = community;

    const amountCommunity = parseFloat(_amount - _amount / 1.03)
      .toFixed(6)
      .toString();
    const amountTrace = parseFloat(_amount / 1.03)
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
              The trace owner decided to support the <b>{communityTitle}</b>! Woo-hoo! <br />{' '}
              <b>
                {amountCommunity} {tokenSymbol}
              </b>{' '}
              will be delegated.
            </li>
            <li>
              The rest (
              <b>
                {amountTrace} {tokenSymbol}
              </b>
              ) will go to the trace owner.
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
            {
              adminId: communityId,
              type: Community.type,
              id: community._id,
            },
            amountCommunity,
            donationOwnerAddress,
            _amount,
            comment,
            _allowanceApprovalType,
          )
        )
          result = await donateWithBridge(model, amountTrace, donationOwnerAddress, 0, comment);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    setSaving(false);
    return result;
  };

  const submit = async () => {
    const { adminId, communityId } = model;

    const donationOwnerAddress = customAddress || currentUser.address;
    const { rates } = await getConversionRates(new Date(), selectedToken.symbol, 'USD');
    const usdValue = rates.USD * amount;
    if (allowanceApprovalType.current === AllowanceApprovalType.Clear) {
      DonationBlockchainService.clearERC20TokenApproval(selectedToken.address, currentUser.address)
        .then(() => {
          setSaving(false);
          setAllowance(new BigNumber(0));
          setAllowanceStatus(AllowanceStatus.Needed);
        })
        .catch(err => {
          const message = `Something went wrong with the transaction`;
          ErrorHandler(err, message);
          setSaving(false);
          setModalVisible(false);
        });
    } else if (communityId && usdValue > config.minimumUsdValueForDonate3PercentToCommunity) {
      donateToCommunity(
        adminId,
        communityId,
        amount,
        donationOwnerAddress,
        allowanceApprovalType.current,
        donationComment,
      )
        .then()
        .catch(() => {});
    } else {
      donateWithBridge(
        model,
        amount,
        donationOwnerAddress,
        amount,
        donationComment,
        allowanceApprovalType.current,
      )
        .then()
        .catch(() => {});
    }

    setSaving(true);
  };

  const { decimals, symbol } = selectedToken;
  const balance = symbol === config.nativeTokenName ? NativeTokenBalance : selectedToken.balance;
  const maxAmount = getMaxAmount();
  const zeroBalance = balance && balance.eq(0);
  let sliderMarks = {};
  if (maxAmount && decimals) {
    sliderMarks = AmountSliderMarks(maxAmount, decimals);
  }

  const submitDefault = () => {
    allowanceApprovalType.current = AllowanceApprovalType.Default;
    form.current.submit();
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
        form.current.submit();
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
        form.current.submit();
      }
    });
  };

  const capitalizeAdminType = type => type.charAt(0).toUpperCase() + type.slice(1);

  let isZeroAmount = false;
  if (Number(amount) === 0) {
    isZeroAmount = true;
  }

  return (
    <Fragment>
      {contentVisible && (
        <Form
          className="card-form"
          ref={form}
          requiredMark
          onFinish={submit}
          scrollToFirstError={{
            block: 'center',
            behavior: 'smooth',
          }}
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
              {model.type.toLowerCase() === Community.type && (
                <span>
                  You&apos;re pledging: as long as the Community owner does not lock your money you
                  can take take it back any time.
                </span>
              )}
              {model.type.toLowerCase() !== Community.type && (
                <span>
                  You&apos;re committing your funds to this {capitalizeAdminType(model.type)}. If
                  you have added your contact information to your <Link to="/profile">Profile</Link>{' '}
                  you will be notified about how your funds are spent.
                </span>
              )}
            </p>
          )}

          {validProvider && isCorrectNetwork && currentUser.address && (
            <div>
              {!model.acceptsSingleToken && (
                <Fragment>
                  <div className="label mb-3">Make your donation in:</div>
                  <Select
                    name="token"
                    id="token-select"
                    value={selectedToken.address}
                    onChange={setToken}
                    style={{ minWidth: '200px' }}
                    className="mr-3 mb-3"
                  >
                    {tokenWhitelistOptions.map(item => (
                      <Select.Option value={item.value} key={item.value}>
                        {item.title}
                      </Select.Option>
                    ))}
                  </Select>
                </Fragment>
              )}

              {/* TODO: remove this b/c the wallet provider will contain this info */}
              {zeroBalance ? (
                <div className="mb-4 mt-2 label">You don&apos;t have any {symbol} token!</div>
              ) : (
                <span>
                  {config.homeNetworkName} {symbol} balance:&nbsp;
                  <em>
                    {convertEthHelper(utils.fromWei(balance ? balance.toFixed() : ''), decimals)}
                  </em>
                </span>
              )}
            </div>
          )}

          {isCorrectNetwork && validProvider && currentUser.address && (
            <Fragment>
              {!zeroBalance ? (
                <Fragment>
                  <span className="label">How much {symbol} do you want to donate?</span>

                  {validProvider && maxAmount.toNumber() !== 0 && balance.gt(0) && (
                    <Fragment>
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
                      <div className="pt-2 pb-4">
                        <InputNumber
                          min={0}
                          max={maxAmount
                            .decimalPlaces(Number(decimals), BigNumber.ROUND_DOWN)
                            .toNumber()}
                          id="amount-input"
                          value={amount}
                          onChange={setAmount}
                          autoFocus
                          style={{ minWidth: '200px' }}
                          className="rounded"
                          size="large"
                          precision={decimals}
                        />
                      </div>
                    </Fragment>
                  )}

                  {showCustomAddress && (
                    <div className="alert alert-success py-1 mb-1">
                      <i className="fa fa-exclamation-triangle" />
                      The donation will be donated on behalf of address:
                    </div>
                  )}

                  <div className="mb-1">
                    <Checkbox
                      checked={showCustomAddress}
                      onChange={() => setShowCustomAddress(!showCustomAddress)}
                    >
                      <div className="label">I want to donate on behalf of another address</div>
                    </Checkbox>
                  </div>
                  {showCustomAddress && (
                    <Form.Item
                      className="mb-0"
                      name="customAddress"
                      initialValue={currentUser.address}
                      rules={[
                        {
                          required: true,
                          type: 'string',
                        },
                        {
                          validator: async (_, val) => {
                            try {
                              utils.toChecksumAddress(val);
                              setFormIsValid(true);
                              return Promise.resolve();
                            } catch (err) {
                              setFormIsValid(false);
                              // eslint-disable-next-line prefer-promise-reject-errors
                              return Promise.reject('Invalid address!');
                            }
                          },
                        },
                      ]}
                    >
                      <Input
                        className="rounded"
                        name="customAddress"
                        id="title-input"
                        value={customAddress}
                        onChange={input => setCustomAddress(input.target.value)}
                      />
                    </Form.Item>
                  )}

                  <div className="form-group">
                    <br />
                    <Input.TextArea
                      name="comment"
                      id="comment-input"
                      className="rounded"
                      placeholder="Comment"
                      onChange={e => setDonationComment(e.target.value)}
                    />
                  </div>
                </Fragment>
              ) : null}

              <div style={{ marginLeft: '-4px' }}>
                {maxAmount.toNumber() !== 0 && (
                  <Fragment>
                    <LoaderButton
                      className="btn btn-success m-1"
                      formNoValidate
                      disabled={
                        isSaving ||
                        (showCustomAddress && !formIsValid) ||
                        isZeroAmount ||
                        !isCorrectNetwork
                      }
                      isLoading={false}
                      onClick={submitDefault}
                    >
                      {allowanceStatus !== AllowanceStatus.Needed ? 'Donate' : 'Unlock & Donate'}
                    </LoaderButton>

                    {allowanceStatus === AllowanceStatus.Needed && (
                      <LoaderButton
                        type="button"
                        className="btn btn-primary m-1"
                        formNoValidate
                        disabled={
                          isSaving ||
                          (showCustomAddress && !formIsValid) ||
                          isZeroAmount ||
                          !isCorrectNetwork
                        }
                        isLoading={false}
                        onClick={submitInfiniteAllowance}
                        data-tip="React-tooltip"
                      >
                        <i className="fa fa-unlock-alt" /> Infinite Unlock & Donate
                      </LoaderButton>
                    )}

                    <ReactTooltip type="dark" effect="solid">
                      <p style={{ maxWidth: 250 }}>
                        Infinite unlock will allow the Giveth Bridge smart contract to interact
                        freely with the {selectedToken.name} in your wallet, this can be changed
                        later by clicking Donate and choosing to Revoke unlike your bank irl..
                        hehehehe
                      </p>
                    </ReactTooltip>

                    {allowanceStatus === AllowanceStatus.Enough && (
                      <LoaderButton
                        className="btn btn-danger m-1"
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
                <span className="m-1">
                  <ExchangeButton />
                </span>
              </div>
            </Fragment>
          )}
        </Form>
      )}
    </Fragment>
  );
};

const modelTypes = PropTypes.shape({
  type: PropTypes.string.isRequired,
  adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  id: PropTypes.string.isRequired,
  communityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
  acceptsSingleToken: PropTypes.bool,
  ownerAddress: PropTypes.string,
  isCapped: PropTypes.bool,
});

DonateButtonModal.propTypes = {
  model: modelTypes.isRequired,
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  customThanksMessage: PropTypes.string,
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }),
  setModalVisible: PropTypes.func.isRequired,
};

DonateButtonModal.defaultProps = {
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
  match: undefined,
  customThanksMessage: undefined,
};

export default React.memo(DonateButtonModal);
