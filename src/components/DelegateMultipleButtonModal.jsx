/* eslint-disable no-restricted-globals */
import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';
import { Input, InputNumber, Select, Slider, Form, Typography } from 'antd';

import Donation from 'models/Donation';
import Campaign from 'models/Campaign';
import Trace from 'models/Trace';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import config from '../configuration';
import ActionNetworkWarning from './ActionNetworkWarning';
import AmountSliderMarks from './AmountSliderMarks';

import DonationBlockchainService from '../services/DonationBlockchainService';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as NotificationContext } from '../contextProviders/NotificationModalProvider';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

BigNumber.config({ DECIMAL_PLACES: 18 });

const etherScanUrl = config.etherscan;

const ModalContent = props => {
  const {
    state: { tokenWhitelist, isLoading: whiteListIsLoading },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser, isLoading: userContextIsLoading },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, validProvider, isEnabled: Web3ContextIsEnabled, web3 },
  } = useContext(Web3Context);
  const {
    actions: { delegationPending, delegationSuccessful, delegationFailed },
  } = useContext(NotificationContext);
  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

  const tokenWhitelistOptions = tokenWhitelist.map(t => ({
    value: t.address,
    title: t.name,
  }));

  const { campaign, trace, setModalVisible } = props;

  const [usdRate, setUsdRate] = useState(0);
  const [sliderMarks, setSliderMarks] = useState();
  const [isDelegationLimited, setIsDelegationLimited] = useState();
  const [isCommunitiesFetched, setIsCommunitiesFetched] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [maxAmount, setMaxAmount] = useState(new BigNumber('0'));
  const [amount, setAmount] = useState('0');
  const [delegationOptions, setDelegationOptions] = useState([]);
  const [objectToDelegateFrom, setObjectToDelegateFrom] = useState([]);
  const [delegationComment, setDelegationComment] = useState('');
  const [selectedToken, setSelectedToken] = useState(
    props.trace && props.trace.acceptsSingleToken ? props.trace.token : tokenWhitelist[0],
  );

  const usdValue = usdRate * amount;
  const tokenSymbol = selectedToken.symbol;

  const delegateFromType = useRef();
  const isMounted = useRef(false);

  const updateRates = () => {
    getConversionRates(new Date(), tokenSymbol, 'USD')
      .then(res => setUsdRate(res.rates.USD))
      .catch(() => setUsdRate(0));
  };

  useEffect(() => {
    if (tokenSymbol) updateRates();
  }, [tokenSymbol]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadDonations = async () => {
    const ids = objectToDelegateFrom;

    if (ids.length !== 1) {
      setLoadingDonations(false);
      return;
    }

    const entity = delegationOptions.find(c => c.id === ids[0]);

    const options = {};
    const { decimals } = selectedToken;

    switch (entity.type) {
      case 'community':
        options.delegateId = entity.delegateId;
        options.delegateTypeId = entity.id;
        options.status = Donation.WAITING;

        break;
      case 'campaign':
        options.ownerId = entity.projectId;
        options.ownerTypeId = entity.id;
        options.status = Donation.COMMITTED;
        break;
      default:
        break;
    }

    const service = feathersClient.service('donations');
    let donations = [];
    let total;
    let spare = config.donationDelegateCountLimit;
    const pledgeSet = new Set();
    // After having #donationDelegateCountLimit distinct pledges, check for next donations and add it if its pledgeId overlaps
    do {
      const query = paramsForServer({
        query: {
          lessThanCutoff: { $ne: true },
          ...options,
          $sort: { createdAt: 1 },
          $limit: spare || 1,
          tokenAddress: selectedToken.address,
          $skip: donations.length,
        },
        schema: 'includeTypeAndGiverDetails',
      });
      // eslint-disable-next-line no-await-in-loop
      const resp = await service.find(query);

      if (spare === 0) {
        if (!pledgeSet.has(resp.data[0].pledgeId)) {
          break;
        }
      } else {
        resp.data.map(d => d.pledgeId).forEach(pledgeId => pledgeSet.add(pledgeId));
        spare = config.donationDelegateCountLimit - pledgeSet.size;
      }

      donations = donations.concat(resp.data);
      total = resp.total;
      // We can collect donations from #donationDelegateCountLimit distinct pledges
    } while (donations.length < total && isMounted.current);

    // start watching donations, this will re-run when donations change or are added

    if (!isMounted.current) return;

    const _delegations = donations.map(d => new Donation(d));
    let delegationSum = _delegations.reduce(
      (sum, d) => sum.plus(d.amountRemaining),
      new BigNumber('0'),
    );

    let localMax = delegationSum;

    if (props.trace && props.trace.isCapped) {
      const traceMaxDonationAmount = props.trace.maxAmount.minus(
        props.trace.totalDonatedSingleToken,
      );

      if (traceMaxDonationAmount.lt(delegationSum)) {
        delegationSum = traceMaxDonationAmount;
        localMax = traceMaxDonationAmount;
        setIsDelegationLimited(false);
      } else if (traceMaxDonationAmount.lt(localMax)) {
        localMax = traceMaxDonationAmount;
      } else if (!traceMaxDonationAmount.lt(delegationSum)) {
        setIsDelegationLimited(true);
      }
    }

    const max = roundBigNumber(localMax, decimals);
    const sliderMark = AmountSliderMarks(max, decimals);

    setSliderMarks(sliderMark);
    setDelegations(_delegations);
    setTotalDonations(total);
    setMaxAmount(max);
    setAmount(convertEthHelper(delegationSum, selectedToken.decimals));
    setLoadingDonations(false);
  };

  const isLimitedDelegateCount = () => {
    if (props.trace && props.trace.isCapped) {
      return totalDonations > delegations.length && isDelegationLimited;
    }

    return totalDonations > delegations.length;
  };

  const setToken = address => {
    setSelectedToken(tokenWhitelist.find(t => t.address === address));
    setLoadingDonations(true);
  };

  useEffect(() => {
    if (objectToDelegateFrom.length) {
      setLoadingDonations(true);
      loadDonations().then();
    }
  }, [objectToDelegateFrom, selectedToken]);

  function selectedObject(value) {
    setObjectToDelegateFrom([value]);
  }

  const getCommunities = () => {
    const userAddress = currentUser ? currentUser.address : '';

    feathersClient
      .service('communities')
      .find({
        query: {
          delegateId: { $gt: '0' },
          ownerAddress: userAddress,
          $select: ['ownerAddress', 'title', '_id', 'delegateId', 'delegateEntity', 'delegate'],
        },
      })
      .then(resp => {
        const communities = resp.data.map(c => ({
          name: c.title,
          id: c._id,
          ownerAddress: c.ownerAddress,
          delegateId: c.delegateId,
          delegateEntity: c.delegateEntity,
          delegate: c.delegate,
          type: 'community',
        }));

        const userIsTraceCampOwner =
          trace && campaign.ownerAddress.toLowerCase() === userAddress.toLowerCase();

        if (isMounted.current) {
          setIsCommunitiesFetched(true);
          if (userIsTraceCampOwner) {
            const campDelegateObj = {
              id: campaign._id,
              name: campaign.title,
              projectId: campaign.projectId,
              ownerEntity: trace.ownerEntity,
              type: 'campaign',
            };
            setDelegationOptions([...communities, campDelegateObj]);
            setObjectToDelegateFrom([campDelegateObj.id]);
          } else {
            setDelegationOptions(communities);
          }
        }
      });
  };

  function submit() {
    setSaving(true);

    const delegate = delegationOptions.find(o => o.id === objectToDelegateFrom[0]);
    const delegateType = delegate.type;

    const onCreated = txLink => {
      setSaving(false);
      setModalVisible(false);
      loadDonations().then();
      delegationPending(txLink, delegateType === 'community');
    };

    const onSuccess = txLink => {
      delegationSuccessful(txLink);
    };

    const onError = (err, txHash) => {
      setSaving(false);
      if (err.code === 4001) {
        delegationFailed(null, 'User denied transaction signature');
      } else {
        delegationFailed(`${etherScanUrl}tx/${txHash}`);
      }
    };

    DonationBlockchainService.delegateMultiple(
      delegations,
      utils.toWei(String(amount)),
      props.trace || props.campaign,
      delegationComment,
      onCreated,
      onSuccess,
      onError,
      web3,
    );
  }

  const prevUser = useRef({});

  useEffect(() => {
    if (prevUser.current.address && prevUser.current.address !== currentUser.address) {
      setModalVisible(false);
    } else if (currentUser.address) {
      setDelegationOptions([]);
      setObjectToDelegateFrom([]);
      setIsCommunitiesFetched(false);
      getCommunities();
    }
    prevUser.current = currentUser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.address]);

  useEffect(() => {
    if (delegationOptions.length === 1) {
      selectedObject(delegationOptions[0].id);
    }
  }, [delegationOptions]);

  useEffect(() => {
    if (objectToDelegateFrom.length > 0) {
      delegateFromType.current = delegationOptions.find(c => c.id === objectToDelegateFrom[0]).type;
    }
  }, [objectToDelegateFrom]);

  const { decimals } = selectedToken;
  let isZeroAmount = false;
  if (Number(amount) === 0) {
    isZeroAmount = true;
  }

  const modalContent = (
    <div id="delegate-multiple-modal">
      <p>
        You are delegating donations to
        {!trace && <strong> {campaign.title}</strong>}
        {trace && <strong> {trace.title}</strong>}
      </p>
      <Fragment>
        {isLimitedDelegateCount() && (
          <div className="alert alert-warning">
            <p>
              <strong>Note:</strong> Due to the current gas limitations you may be required to
              delegate multiple times. You cannot delegate from more than{' '}
              <strong>{config.donationDelegateCountLimit}</strong> sources on each transaction. In
              this try, you are allowed to delegate money of <strong>{delegations.length}</strong>{' '}
              donations of total <strong>{totalDonations}</strong> available in{' '}
              {delegateFromType.current === 'community' ? 'Community' : 'Campaign'}.
            </p>
          </div>
        )}
        <Form onFinish={submit}>
          <div>
            <div className="label">Delegate from:</div>
            <Select
              name="delegateFrom"
              placeholder={trace ? 'Select a Community or Campaign' : 'Select a Community'}
              value={objectToDelegateFrom}
              onChange={selectedObject}
              style={{ minWidth: '200px' }}
              className="mr-3 mb-3"
            >
              {delegationOptions.map(item => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {objectToDelegateFrom.length !== 1 && (
            <p>
              Please select entity from which you want to delegate money to the{' '}
              {trace ? trace.title : campaign.title}{' '}
            </p>
          )}
          {objectToDelegateFrom.length === 1 && isLoadingDonations && <Loader />}
          {objectToDelegateFrom.length === 1 && !isLoadingDonations && (
            <div>
              {(!props.trace || !props.trace.acceptsSingleToken) && (
                <Fragment>
                  <div className="label">
                    {`Select token or ${config.nativeTokenName} to delegate`}
                  </div>
                  <Select
                    name="token"
                    id="token-select"
                    value={selectedToken && selectedToken.address}
                    onChange={setToken}
                    style={{ minWidth: '200px' }}
                    className="mb-3"
                  >
                    {tokenWhitelistOptions.map(item => (
                      <Select.Option value={item.value} key={item.value}>
                        {item.title}
                      </Select.Option>
                    ))}
                  </Select>
                </Fragment>
              )}

              {delegations.length === 0 || maxAmount.isZero() ? (
                <p>
                  The amount available to delegate is 0 {tokenSymbol}
                  <br />
                  Please select{' '}
                  {!props.trace || !props.trace.acceptsSingleToken
                    ? 'a different currency or '
                    : ''}
                  different source {trace ? 'Community/Campaign' : 'Community'}
                </p>
              ) : (
                <div>
                  <span className="label">Amount {tokenSymbol} to delegate:</span>

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

                  <div className="form-group pt-2">
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
                    <Typography.Text className="ant-form-text pl-2" type="secondary">
                      ≈ {Math.round(usdValue)} USD
                    </Typography.Text>
                  </div>
                  <div className="form-group">
                    <Input.TextArea
                      name="comment"
                      id="comment-input"
                      className="rounded"
                      placeholder="Comment"
                      onChange={e => setDelegationComment(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    formNoValidate
                    type="submit"
                    disabled={isSaving || isZeroAmount || !isForeignNetwork}
                  >
                    {isSaving ? 'Delegating...' : 'Delegate here'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Form>
      </Fragment>
    </div>
  );

  const modalLoading = (
    <div>
      <h2>Please wait while data is loading</h2>
      <Loader />
    </div>
  );

  const isContextReady =
    !whiteListIsLoading && !userContextIsLoading && Web3ContextIsEnabled && isCommunitiesFetched;

  return (
    <React.Fragment>
      {!validProvider && (
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle" />
          It is recommended that you install <a href="https://metamask.io/">MetaMask</a> to donate
        </div>
      )}
      {validProvider && (
        <ActionNetworkWarning
          incorrectNetwork={!isForeignNetwork}
          networkName={config.foreignNetworkName}
        />
      )}{' '}
      {isContextReady ? validProvider && isForeignNetwork && modalContent : modalLoading}
    </React.Fragment>
  );
};

ModalContent.propTypes = {
  campaign: PropTypes.instanceOf(Campaign),
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ),
  setModalVisible: PropTypes.func.isRequired,
};

ModalContent.defaultProps = {
  campaign: undefined,
  trace: undefined,
};

export default React.memo(ModalContent);
