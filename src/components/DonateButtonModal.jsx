/* eslint-disable react/prop-types */
// eslint-disable-next-line max-classes-per-file
import React, { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Form, Select, Input, InputNumber, Checkbox, Button, Modal, Typography } from 'antd';
import { GivethBridge } from 'giveth-bridge';

import getTokens from '../lib/blockchain/getTokens';
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
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import ActionNetworkWarning from './ActionNetworkWarning';
import Community from '../models/Community';
import { convertEthHelper, ZERO_ADDRESS } from '../lib/helpers';
import ExchangeButton from './ExchangeButton';
import pollEvery from '../lib/pollEvery';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';
import { convertUsdValueToEthValue } from '../services/ConversionRateService';

const UPDATE_ALLOWANCE_DELAY = 1000; // Delay allowance update inorder to network respond new value
const POLL_DELAY_TOKENS = 2000;

const deepPurple = '#2C0B3F';
const dark = '#6B7087';
const latoFont = "'Lato', sans-serif";
const modalNoteStyle = { fontFamily: latoFont, fontSize: '18px', color: dark };
const modalLabelStyle = {
  color: deepPurple,
  fontSize: '16px',
  marginBottom: '10px',
};
const modalExtraNoteStyle = {
  fontFamily: latoFont,
  color: dark,
  marginTop: '6px',
};

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
    state: { isHomeNetwork, validProvider, balance: NativeTokenBalance, web3 },
  } = useContext(Web3Context);
  const {
    actions: { donationPending, donationSuccessful, donationFailed },
  } = useContext(NotificationContext);
  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

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
  const [usdRate, setUsdRate] = useState(0);

  const { nativeTokenName } = config;
  const { decimals, symbol: tokenSymbol, balance: selectedTokenBalance } = selectedToken;
  const NativeTokenBalanceNum = NativeTokenBalance && NativeTokenBalance.toNumber();
  const selectedTokenBalanceNum = selectedTokenBalance && selectedTokenBalance.toNumber();
  const balance = tokenSymbol === nativeTokenName ? NativeTokenBalance : selectedTokenBalance;
  const zeroBalance = balance && balance.eq(0);
  const tokens = getTokens({ web3, tokenWhitelist });
  const isCorrectNetwork = isHomeNetwork;
  const userAddress = currentUser.address;
  const usdValue = usdRate * amount;

  const form = useRef();
  const givethBridge = useRef();
  const stopPolling = useRef();
  const allowanceApprovalType = useRef();

  const clearUp = () => {
    if (stopPolling.current) stopPolling.current();
  };

  const getMaxAmount = useCallback(() => {
    const { communityId } = model;

    // Determine max amount
    if (balance === undefined) return new BigNumber(0);
    const maxFromWei = utils.fromWei(balance.toFixed());

    let _maxAmount;
    if (maxFromWei.isNaN || maxFromWei === 'NaN') {
      _maxAmount = new BigNumber(0);
    } else {
      _maxAmount = new BigNumber(convertEthHelper(maxFromWei, decimals));
    }

    let { maxDonationAmount } = props;
    if (maxDonationAmount) {
      if (communityId !== undefined && communityId !== 0) {
        maxDonationAmount *= 1.03;
      }
      _maxAmount = _maxAmount.gt(maxDonationAmount)
        ? new BigNumber(convertEthHelper(maxDonationAmount, decimals))
        : _maxAmount;
    }

    return _maxAmount;
  }, [selectedTokenBalanceNum, NativeTokenBalanceNum]);

  const maxAmount = getMaxAmount();

  const updateAllowance = (delay = 0) => {
    const isDonationInToken = tokenSymbol !== nativeTokenName;
    if (!isDonationInToken) {
      setAllowance(new BigNumber(0));
      setAllowanceStatus(AllowanceStatus.NotNeeded);
    } else if (validProvider && userAddress) {
      // Fetch from network after 1 sec inorder to new allowance value be returned in response
      setTimeout(
        () =>
          DonationBlockchainService.getERC20tokenAllowance(
            selectedToken.address,
            userAddress,
            tokens[selectedToken.address],
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

  const setToken = address => {
    const token = tokenWhitelist.find(t => t.address === address);
    if (!token.balance && token.symbol !== nativeTokenName) {
      token.balance = new BigNumber('0');
    } // FIXME: There should be a balance provider handling all of ..
    const defaultAmount = '0';
    setSelectedToken(token);
    setAmount(defaultAmount);
  };

  const updateAllowanceStatus = useCallback(() => {
    const isDonationInToken = tokenSymbol !== nativeTokenName;
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
  }, [selectedTokenBalanceNum, allowance, amount]);

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
            if (tokenSymbol === nativeTokenName) {
              return new BigNumber(NativeTokenBalance);
            }

            const contract = tokens[selectedToken.address];

            // we are only interested in homeNetwork token balances
            if (!isCorrectNetwork || !userAddress || !contract) {
              return new BigNumber(0);
            }

            return new BigNumber(await contract.methods.balanceOf(userAddress).call());
          } catch (e) {
            return new BigNumber(0);
          }
        },
        onResult: _balance => {
          if (_balance && (!selectedTokenBalance || !selectedTokenBalance.eq(_balance))) {
            setSelectedToken({ ...selectedToken, balance: _balance });
          }
        },
      }),
      POLL_DELAY_TOKENS,
    )();
  }, [userAddress, isCorrectNetwork, selectedTokenBalanceNum, tokenSymbol]);

  useEffect(() => {
    updateAllowanceStatus();
  }, [amount, allowance]);

  const updateRates = () => {
    getConversionRates(new Date(), tokenSymbol, 'USD')
      .then(res => setUsdRate(res.rates.USD))
      .catch(() => setUsdRate(0));
  };

  useEffect(() => {
    if (tokenSymbol) updateRates();
  }, [tokenSymbol]);

  useEffect(() => {
    if (isCorrectNetwork) {
      pollToken();
      updateAllowance();
    } else {
      clearUp();
    }
  }, [userAddress, isCorrectNetwork, selectedTokenBalanceNum, tokenSymbol]);

  const canDonateToProject = () => {
    const { acceptsSingleToken, token } = model;
    return (
      !acceptsSingleToken ||
      tokenWhitelist.find(
        t => t.foreignAddress.toLocaleLowerCase() === token.foreignAddress.toLocaleLowerCase(),
      )
    );
  };

  useEffect(() => {
    givethBridge.current = new GivethBridge(web3, config.givethBridgeAddress);

    updateAllowance();

    const defaultToken =
      tokenWhitelist.find(t => t.symbol === config.defaultDonateToken) || tokenWhitelist[0] || {};
    const modelToken = { ...model.token, balance: new BigNumber(0) };
    setSelectedToken(model.acceptsSingleToken ? modelToken : defaultToken);

    if (!canDonateToProject()) {
      Modal.error({
        title: 'Token is not Active to Donate',
        content: (
          <div>
            <p>
              Token <strong>{model.token.symbol}</strong> cannot be directly donated anymore.
              <br />
              <strong>Delegate</strong> and <strong>Withdraw</strong> actions are still available
              for this token.
            </p>
          </div>
        ),
        centered: true,
      });
    } else {
      const { isCapped } = model;
      if (isCapped) {
        setAmount(getMaxAmount().toFixed());
      }
      setContentVisible(true);
    }

    return clearUp;
  }, []);

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
  const donateWithBridge = async ({
    toAdmin,
    _amount,
    donationOwnerAddress,
    comment,
    _allowanceApprovalType = AllowanceApprovalType.Default,
  }) => {
    const { homeEtherscan: etherscanUrl } = config;

    const amountWei = utils.toWei(new BigNumber(_amount).toFixed(18));
    const isDonationInToken = tokenSymbol !== nativeTokenName;
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
                userAddress,
                toAdmin.adminId,
                tokenAddress,
                amountWei,
                opts,
              );
        donationOwner = currentUser;
      }

      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        let txHash;
        let txUrl;
        const currency = selectedToken.symbol;
        const valueEth = currency === 'ETH' ? _amount : await convertUsdValueToEthValue(usdValue);
        const entityOwner = await feathersClient.service('users').get(toAdmin.ownerAddress);
        const analyticsData = {
          donorAddress: userAddress,
          donorName: currentUser.name,
          usdValue,
          valueEth,
          donationOwnerAddress,
          entityType: toAdmin.type,
          traceType: toAdmin.formType,
          entityId: toAdmin.id,
          entityTitle: toAdmin.title,
          entitySlug: toAdmin.slug,
          entityOwnerAddress: toAdmin.ownerAddress,
          entityOwnerName: entityOwner.name,
          entityOwnerEmail: entityOwner.email,
          amount: _amount,
          currency,
        };

        method
          .on('transactionHash', async transactionHash => {
            const { nonce } = await web3.eth.getTransaction(transactionHash);

            txHash = transactionHash;

            const newDonation = await DonationBlockchainService.newFeathersDonation(
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
              txHash,
              donationId: newDonation._id,
              ...analyticsData,
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
                  url: txUrl,
                  txHash,
                  ...analyticsData,
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

    return _makeDonationTx();
  };

  const donateToCommunity = async ({
    communityId,
    _amount,
    donationOwnerAddress,
    _allowanceApprovalType,
    comment,
  }) => {
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

    const isConfirmed = await new Promise(resolve =>
      Modal.confirm({
        title: 'Twice as good!',
        content: (
          <div>
            <p>For your donation you need to make 2 transactions:</p>
            <ol style={{ textAlign: 'left', marginLeft: '-29px' }}>
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
          </div>
        ),
        cancelText: 'Cancel',
        okText: 'Lets do it!',
        centered: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      }),
    );

    let result = false;
    if (isConfirmed) {
      try {
        if (
          await donateWithBridge({
            toAdmin: {
              adminId: communityId,
              type: Community.type,
              slug: community.slug,
              ownerAddress: community.ownerAddress,
              id: community._id,
            },
            donationOwnerAddress,
            _amount: amountCommunity,
            comment,
            _allowanceApprovalType,
          })
        )
          result = await donateWithBridge({
            toAdmin: model,
            _amount: amountTrace,
            donationOwnerAddress,
            allowanceAmount: 0,
            comment,
          });
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    setSaving(false);
    return result;
  };

  const submit = async () => {
    const { communityId } = model;

    const donationOwnerAddress = customAddress || userAddress;
    if (communityId && usdValue > config.minimumUsdValueForDonate3PercentToCommunity) {
      donateToCommunity({
        communityId,
        _amount: amount,
        donationOwnerAddress,
        _allowanceApprovalType: allowanceApprovalType.current,
        comment: donationComment,
      })
        .then()
        .catch(() => {});
    } else {
      donateWithBridge({
        toAdmin: model,
        _amount: amount,
        donationOwnerAddress,
        allowanceAmount: amount,
        comment: donationComment,
        _allowanceApprovalType: allowanceApprovalType.current,
      })
        .then()
        .catch(() => {});
    }

    setSaving(true);
  };

  const submitDefault = () => {
    allowanceApprovalType.current = AllowanceApprovalType.Default;
    form.current.submit();
  };

  const submitInfiniteAllowance = async () => {
    allowanceApprovalType.current = AllowanceApprovalType.Infinite;
    setSaving(true);
    try {
      const allowed = await DonationBlockchainService.approveERC20tokenTransfer(
        selectedToken.address,
        userAddress,
        INFINITE_ALLOWANCE.toString(),
        () => updateAllowance(UPDATE_ALLOWANCE_DELAY),
        web3,
        tokens[selectedToken.address],
      );

      // Maybe user has canceled the allowance approval transaction
      if (allowed) {
        setAllowanceStatus(AllowanceStatus.Enough);
      }
      setSaving(false);
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
  };

  const capitalizeAdminType = type => type.charAt(0).toUpperCase() + type.slice(1);

  let isZeroAmount = false;
  if (Number(amount) === 0) {
    isZeroAmount = true;
  }

  return (
    <div id="donate-modal">
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
          <h3 style={{ color: deepPurple }}>
            <span className="font-weight-bold">Donate to support </span>
            <span>{model.title}</span>
          </h3>

          {!validProvider && (
            <div className="alert alert-warning">
              <i className="fa fa-exclamation-triangle" />
              Please install <a href="https://metamask.io/">MetaMask</a> to donate
            </div>
          )}

          {validProvider && !userAddress && (
            <div className="alert alert-warning">
              <i className="fa fa-exclamation-triangle" />
              It looks like your Ethereum Provider is locked or you need to enable it.
            </div>
          )}

          {validProvider && userAddress && (
            <ActionNetworkWarning
              incorrectNetwork={!isCorrectNetwork}
              networkName={config.homeNetworkName}
            />
          )}

          {isCorrectNetwork && userAddress && (
            <div className="my-3">
              {model.type.toLowerCase() === Community.type && (
                <span>
                  You&apos;re pledging: as long as the Community owner does not lock your money you
                  can take take it back any time.
                </span>
              )}
              {model.type.toLowerCase() !== Community.type && (
                <span style={modalNoteStyle}>
                  You&apos;re committing your funds to this {capitalizeAdminType(model.type)}. If
                  you have added your contact information in your <Link to="/profile">Profile</Link>{' '}
                  you will be notified about how your funds are spent.
                </span>
              )}
            </div>
          )}

          <div style={{ maxWidth: '540px' }}>
            {validProvider && isCorrectNetwork && userAddress && (
              <Fragment>
                <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                  <div className="mt-3">
                    <div style={modalLabelStyle}>Make your donation in</div>
                    <Select
                      name="token"
                      id="token-select"
                      value={selectedToken.address}
                      onChange={setToken}
                      disabled={isSaving || model.acceptsSingleToken}
                      style={{ minWidth: '200px' }}
                    >
                      {tokenWhitelist.map(item => (
                        <Select.Option value={item.address} key={item.address}>
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                    <div style={modalExtraNoteStyle}>Select the token you want to donate</div>
                  </div>

                  {maxAmount.toNumber() !== 0 && !zeroBalance && (
                    <div className="mt-3">
                      <div style={modalLabelStyle}>Amount to donate</div>
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
                        disabled={isSaving}
                      />
                      {!isSaving && (
                        <Button
                          style={{ marginLeft: '-60px' }}
                          type="link"
                          onClick={() => setAmount(maxAmount.toNumber())}
                        >
                          MAX
                        </Button>
                      )}
                      <Typography.Text className="ant-form-text pl-2 eq-usd-value" type="secondary">
                        ≈ {Math.round(usdValue)} USD
                      </Typography.Text>
                      {/* TODO: remove this b/c the wallet provider will contain this info */}
                      <div style={modalExtraNoteStyle}>
                        Wallet balance:&nbsp;
                        {convertEthHelper(
                          utils.fromWei(balance ? balance.toFixed() : ''),
                          decimals,
                        )}
                        {` ${tokenSymbol}`}
                      </div>
                    </div>
                  )}
                  {zeroBalance && (
                    <div className="font-weight-bold">
                      You don&apos;t have any {tokenSymbol} token!
                    </div>
                  )}
                </div>

                {!zeroBalance && (
                  <Fragment>
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
                        disabled={isSaving}
                      >
                        <div style={modalLabelStyle}>
                          I want to donate on behalf of another address
                        </div>
                      </Checkbox>
                    </div>
                    {showCustomAddress && (
                      <Form.Item
                        className="mb-0"
                        name="customAddress"
                        initialValue={userAddress}
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
                          disabled={isSaving}
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
                        style={{ maxWidth: '550px' }}
                        rows={4}
                        onChange={e => setDonationComment(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </Fragment>
                )}

                <div className="d-flex">
                  {maxAmount.toNumber() !== 0 && (
                    <div className="w-100 mr-3">
                      <LoaderButton
                        className="ant-btn-donate ant-btn-lg rounded ant-btn-block"
                        disabled={
                          isSaving ||
                          (showCustomAddress && !formIsValid) ||
                          isZeroAmount ||
                          !isCorrectNetwork
                        }
                        isLoading={isSaving}
                        onClick={
                          allowanceStatus !== AllowanceStatus.Needed
                            ? submitDefault
                            : submitInfiniteAllowance
                        }
                        data-tip="React-tooltip"
                        loadingText="Pending"
                      >
                        {allowanceStatus !== AllowanceStatus.Needed ? 'Donate' : 'Approve'}
                      </LoaderButton>

                      {allowanceStatus === AllowanceStatus.Needed && (
                        <ReactTooltip type="dark" effect="solid">
                          <p style={{ maxWidth: 250 }}>
                            This will allow the Giveth Bridge smart contract to interact freely with
                            the {selectedToken.name} in your wallet.
                          </p>
                        </ReactTooltip>
                      )}
                    </div>
                  )}
                  <span className="w-100">
                    <ExchangeButton />
                  </span>
                </div>
              </Fragment>
            )}
          </div>
        </Form>
      )}
    </div>
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
