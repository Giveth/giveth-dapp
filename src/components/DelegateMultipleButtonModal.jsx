/* eslint-disable no-restricted-globals */
import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Form, Textarea } from 'formsy-react-components';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';
import 'react-rangeslider/lib/index.css';
import InputToken from 'react-input-token';
import { Slider } from 'antd';

import Donation from 'models/Donation';
import Campaign from 'models/Campaign';
import Milestone from 'models/Milestone';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import config from '../configuration';
import SelectFormsy from './SelectFormsy';
import ActionNetworkWarning from './ActionNetworkWarning';
import NumericInput from './NumericInput';

import DonationService from '../services/DonationService';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';
import { Context as UserContext } from '../contextProviders/UserProvider';
import ErrorHandler from '../lib/ErrorHandler';

BigNumber.config({ DECIMAL_PLACES: 18 });

const ModalContent = props => {
  const {
    state: { tokenWhitelist, isLoading: whiteListIsLoading },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser, isLoading: userContextIsLoading },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, validProvider, isEnabled: Web3ContextIsEnabled },
  } = useContext(Web3Context);

  const tokenWhitelistOptions = tokenWhitelist.map(t => ({
    value: t.address,
    title: t.name,
  }));

  const { campaign, milestone, setModalVisible } = props;

  const [isDelegationLimited, setIsDelegationLimited] = useState();
  const [isDacsFetched, setIsDacsFetched] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [maxAmount, setMaxAmount] = useState(new BigNumber('0'));
  const [amount, setAmount] = useState('0');
  const [delegationOptions, setDelegationOptions] = useState([]);
  const [objectToDelegateFrom, setObjectToDelegateFrom] = useState([]);
  const [selectedToken, setSelectedToken] = useState(
    props.milestone && props.milestone.acceptsSingleToken
      ? props.milestone.token
      : tokenWhitelist[0],
  );

  const delegateFromType = useRef();

  const loadDonations = async ids => {
    if (ids.length !== 1) return;

    const entity = delegationOptions.find(c => c.id === ids[0]);

    const options = {};

    switch (entity.type) {
      case 'dac':
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
    } while (donations.length < total);

    // start watching donations, this will re-run when donations change or are added

    const _delegations = donations.map(d => new Donation(d));
    let delegationSum = _delegations.reduce(
      (sum, d) => sum.plus(d.amountRemaining),
      new BigNumber('0'),
    );

    let localMax = delegationSum;

    if (props.milestone && props.milestone.isCapped) {
      const milestoneMaxDonationAmount = props.milestone.maxAmount.minus(
        props.milestone.totalDonatedSingleToken,
      );

      if (milestoneMaxDonationAmount.lt(delegationSum)) {
        delegationSum = milestoneMaxDonationAmount;
        localMax = milestoneMaxDonationAmount;
        setIsDelegationLimited(false);
      } else if (milestoneMaxDonationAmount.lt(localMax)) {
        localMax = milestoneMaxDonationAmount;
      } else if (!milestoneMaxDonationAmount.lt(delegationSum)) {
        setIsDelegationLimited(true);
      }
    }

    setDelegations(_delegations);
    setTotalDonations(total);
    setMaxAmount(roundBigNumber(localMax, selectedToken.decimals));
    setLoadingDonations(false);
    setAmount(convertEthHelper(delegationSum, selectedToken.decimals));
    setLoadingDonations(false);
  };

  const isLimitedDelegateCount = () => {
    if (props.milestone && props.milestone.isCapped) {
      return totalDonations > delegations.length && isDelegationLimited;
    }

    return totalDonations > delegations.length;
  };

  const setToken = address => {
    setSelectedToken(tokenWhitelist.find(t => t.address === address));
    setLoadingDonations(true);
  };

  function selectedObject({ target }) {
    setObjectToDelegateFrom(target.value);
    setLoadingDonations(true);
    loadDonations(target.value).then();
  }

  const getDacs = () => {
    const userAddress = currentUser ? currentUser.address : '';
    feathersClient
      .service('dacs')
      .find({
        query: {
          delegateId: { $gt: '0' },
          ownerAddress: userAddress,
          $select: ['ownerAddress', 'title', '_id', 'delegateId', 'delegateEntity', 'delegate'],
        },
      })
      .then(resp => {
        const dacs = resp.data.map(c => ({
          name: c.title,
          id: c._id,
          ownerAddress: c.ownerAddress,
          delegateId: c.delegateId,
          delegateEntity: c.delegateEntity,
          delegate: c.delegate,
          type: 'dac',
        }));

        const _delegationOptions =
          milestone && campaign.ownerAddress.toLowerCase() === userAddress.toLowerCase()
            ? dacs.concat([
                {
                  id: campaign._id,
                  name: campaign.title,
                  projectId: campaign.projectId,
                  ownerEntity: milestone.ownerEntity,
                  type: 'campaign',
                },
              ])
            : dacs;
        setIsDacsFetched(true);
        setDelegationOptions(_delegationOptions);
      });
  };

  function submit({ comment }) {
    setSaving(true);

    const delegate = delegationOptions.find(o => o.id === objectToDelegateFrom[0]);
    const delegateType = delegate.type;

    const onCreated = txLink => {
      setSaving(false);
      setModalVisible(false);
      setObjectToDelegateFrom([]);
      React.swal({
        title: 'Delegated!',
        content: React.swal.msg(
          <span>
            The donations have been delegated,{' '}
            <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
              view the transaction here.
            </a>
            {delegateType === 'dac' && (
              <p>
                The donations have been delegated. Please note the the Giver may have{' '}
                <strong>3 days</strong> to reject your delegation before the money gets committed.
              </p>
            )}
          </span>,
        ),
        icon: 'success',
      });
    };

    const onSuccess = txLink => {
      React.toast.success(
        <p>
          The delegation has been confirmed!
          <br />
          <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>,
      );
    };

    const onError = err => {
      setSaving(false);
      ErrorHandler(err, 'Something wrong in delegation, please try later');
    };

    const onCancel = () => {
      setSaving(false);
    };

    DonationService.delegateMultiple(
      delegations,
      utils.toWei(amount),
      props.milestone || props.campaign,
      comment,
      onCreated,
      onSuccess,
      onError,
      onCancel,
    );
  }

  const toggleFormIsValid = state => {
    setFormIsValid(state);
  };

  const isFirstRun = useRef(true); // To skip unnecessary initial render

  useEffect(() => {
    setIsDacsFetched(false);
    getDacs();
  }, []);

  useEffect(() => {
    if (delegationOptions.length === 1) {
      selectedObject({ target: { value: [delegationOptions[0].id] } });
    }
  }, [delegationOptions]);

  useEffect(() => {
    if (objectToDelegateFrom.length > 0) {
      delegateFromType.current = delegationOptions.find(c => c.id === objectToDelegateFrom[0]).type;
    }
  }, [objectToDelegateFrom]);

  useEffect(() => {
    if (!isFirstRun.current) {
      loadDonations(objectToDelegateFrom).then();
    }
  }, [selectedToken]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false; // Set initial render to false. This useEffect must be always the last one.
    } else {
      setModalVisible(false);
      setDelegationOptions([]);
      setObjectToDelegateFrom([]);
    }
  }, [currentUser]);

  const sliderMarks = {
    0: '0',
  };
  sliderMarks[maxAmount.toNumber()] = maxAmount.toNumber();
  const { decimals } = selectedToken;

  const modalContent = (
    <Fragment>
      {' '}
      <p>
        You are delegating donations to
        {!milestone && <strong> {campaign.title}</strong>}
        {milestone && <strong> {milestone.title}</strong>}
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
              {delegateFromType.current === 'dac' ? 'DAC' : 'Campaign'}.
            </p>
          </div>
        )}
        <Form
          onSubmit={submit}
          layout="vertical"
          onValid={() => toggleFormIsValid(true)}
          onInvalid={() => toggleFormIsValid(false)}
        >
          <div className="form-group">
            <span className="label">Delegate from:</span>
            <InputToken
              name="delegateFrom"
              label="Delegate from:"
              placeholder={milestone ? 'Select a DAC or Campaign' : 'Select a DAC'}
              value={objectToDelegateFrom}
              options={delegationOptions}
              onSelect={v => selectedObject(v)}
              maxLength={1}
            />
          </div>

          {objectToDelegateFrom.length !== 1 && (
            <p>
              Please select entity from which you want to delegate money to the{' '}
              {milestone ? milestone.title : campaign.title}{' '}
            </p>
          )}
          {objectToDelegateFrom.length === 1 && isLoadingDonations && <Loader />}
          {objectToDelegateFrom.length === 1 && !isLoadingDonations && (
            <div>
              {(!props.milestone || !props.milestone.acceptsSingleToken) && (
                <SelectFormsy
                  name="token"
                  id="token-select"
                  label={`Select token or ${config.nativeTokenName} to delegate`}
                  helpText=""
                  value={selectedToken && selectedToken.address}
                  options={tokenWhitelistOptions}
                  onChange={address => setToken(address)}
                />
              )}

              {delegations.length === 0 || maxAmount.isZero() ? (
                <p>
                  The amount available to delegate is 0 {selectedToken.symbol}
                  <br />
                  Please select{' '}
                  {!props.milestone || !props.milestone.acceptsSingleToken
                    ? 'a different currency or '
                    : ''}
                  different source {milestone ? 'DAC/Campaign' : 'DAC'}
                </p>
              ) : (
                <div>
                  <span className="label">Amount {selectedToken.symbol} to delegate:</span>

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

                  <div className="form-group">
                    <NumericInput
                      onChange={setAmount}
                      token={selectedToken}
                      value={amount}
                      lteMessage={`The donations you are delegating have combined value of ${maxAmount.toNumber()}. Do not input higher amount than that.`}
                      id="amount-input"
                      maxAmount={maxAmount}
                    />
                  </div>
                  <div className="form-group">
                    <Textarea name="comment" id="comment-input" value="" placeholder="Comment" />
                  </div>
                  <button
                    className="btn btn-success"
                    formNoValidate
                    type="submit"
                    disabled={isSaving || !isForeignNetwork || !formIsValid}
                  >
                    {isSaving ? 'Delegating...' : 'Delegate here'}
                  </button>
                  <button
                    className="btn btn-light float-right"
                    type="button"
                    onClick={() => {
                      setModalVisible(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </Form>
      </Fragment>
    </Fragment>
  );

  const modalLoading = (
    <div>
      <h2>Please wait while data is loading</h2>
      <Loader />
    </div>
  );

  const isContextReady =
    !whiteListIsLoading && !userContextIsLoading && Web3ContextIsEnabled && isDacsFetched;

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
  milestone: PropTypes.instanceOf(Milestone),
  setModalVisible: PropTypes.func.isRequired,
};

ModalContent.defaultProps = {
  campaign: undefined,
  milestone: undefined,
};

export default ModalContent;
