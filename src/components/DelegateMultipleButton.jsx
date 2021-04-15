/* eslint-disable no-restricted-globals */
import React, { Fragment, useContext, useRef, useState } from 'react';
import Modal from 'react-modal';
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
import { checkBalance, isLoggedIn } from '../lib/middleware';
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
Modal.setAppElement('#root');

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
    minHeight: '350px',
  },
};

const closeButtonStyle = {
  position: 'absolute',
  top: '0px',
  right: '0px',
};

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {BN}           balance     Current user's balance
 * @prop {User}         currentUser Current user of the Dapp
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Object}       milestone   It the delegation is towards campaign, this contains the milestone
 * @prop {Object}       style       Styles added to the button
 */
const DelegateMultipleButton = props => {
  const {
    state: { tokenWhitelist, isLoading: whiteListIsLoading },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser, isLoading: userContextIsLoading },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, validProvider, balance, isEnabled: Web3ContextIsEnabled },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const tokenWhitelistOptions = tokenWhitelist.map(t => ({
    value: t.address,
    title: t.name,
  }));

  const [isSaving, setSaving] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
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

  const dacsObserver = useRef(null);

  const loadDonations = async (ids, token) => {
    if (ids.length !== 1) return;

    let selToken;
    if (token) selToken = token;
    else selToken = selectedToken;

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
          tokenAddress: selToken.address,
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
    let newAmount = _delegations.reduce(
      (sum, d) => sum.plus(d.amountRemaining),
      new BigNumber('0'),
    );

    let localMax = newAmount;

    if (props.milestone && props.milestone.isCapped) {
      const maxDonationAmount = props.milestone.maxAmount.minus(
        props.milestone.totalDonatedSingleToken,
      );

      if (maxDonationAmount.lt(newAmount)) {
        newAmount = maxDonationAmount;
        localMax = maxDonationAmount;
      } else if (maxDonationAmount.lt(localMax)) {
        localMax = maxDonationAmount;
      }
    }

    setDelegations(_delegations);
    setTotalDonations(total);
    setMaxAmount(roundBigNumber(localMax, selToken.decimals));
    setLoadingDonations(false);
    setAmount(convertEthHelper(newAmount, selToken.decimals));

    setLoadingDonations(false);
  };

  const setToken = address => {
    const token = tokenWhitelist.find(t => t.address === address);
    setSelectedToken(token);
    setLoadingDonations(true);
    loadDonations(objectToDelegateFrom, token).then();
  };

  function selectedObject({ target }) {
    setObjectToDelegateFrom(target.value);
    setLoadingDonations(true);
    loadDonations(target.value).then();
  }

  const getDacs = () => {
    const { milestone, campaign } = props;
    const userAddress = currentUser ? currentUser.address : '';
    dacsObserver.current = feathersClient
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

        setDelegationOptions(_delegationOptions);
        if (_delegationOptions.length === 1) {
          selectedObject({ target: { value: [_delegationOptions[0].id] } });
        }
      });
  };

  function openDialog() {
    isLoggedIn(currentUser)
      .then(() => checkBalance(balance))
      .then(() => {
        setModalVisible(true);
        getDacs();
      });
  }

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

  const style = { display: 'inline-block', ...props.style };
  const { campaign, milestone } = props;

  let delegateFromType;
  if (objectToDelegateFrom.length > 0) {
    delegateFromType = delegationOptions.find(c => c.id === objectToDelegateFrom[0]).type;
  }

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
        {totalDonations > delegations.length && (
          <div className="alert alert-warning">
            <p>
              <strong>Note:</strong> Due to the current gas limitations you may be required to
              delegate multiple times. You cannot delegate from more than{' '}
              <strong>{config.donationDelegateCountLimit}</strong> sources on each transaction. In
              this try, you are allowed to delegate money of <strong>{delegations.length}</strong>{' '}
              donations of total <strong>{totalDonations}</strong> available in{' '}
              {delegateFromType === 'dac' ? 'DAC' : 'Campaign'}.
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

  const isContextReady = !whiteListIsLoading && !userContextIsLoading && Web3ContextIsEnabled;

  return (
    <span style={style}>
      <button
        type="button"
        className="btn btn-info"
        onClick={() => {
          if (validProvider && !isForeignNetwork) {
            displayForeignNetRequiredWarning();
          } else {
            openDialog();
          }
        }}
      >
        Delegate funds here
      </button>

      <Modal
        isOpen={modalVisible}
        style={modalStyles}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <button
          type="button"
          className="btn btn-sm"
          style={closeButtonStyle}
          onClick={() => {
            setModalVisible(false);
          }}
        >
          <i className="fa fa-close" />
        </button>
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
      </Modal>
    </span>
  );
};

DelegateMultipleButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign),
  milestone: PropTypes.instanceOf(Milestone),
  style: PropTypes.shape(),
};

DelegateMultipleButton.defaultProps = {
  campaign: undefined,
  milestone: undefined,
  style: {},
};

export default React.memo(DelegateMultipleButton);
