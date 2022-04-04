import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Col, Form, PageHeader, Row } from 'antd';
import BigNumber from 'bignumber.js';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { utils } from 'web3';

import CreateExpenseItem from '../CreateExpenseItem';
import {
  ANY_TOKEN,
  convertEthHelper,
  getStartOfDayUTC,
  history,
  isOwner,
  ZERO_ADDRESS,
} from '../../lib/helpers';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  TraceCampaignInfo,
  TraceDatePicker,
  TraceDescription,
  TraceDonateToCommunity,
  TraceFiatAmountCurrency,
  TraceRecipientAddress,
  TraceReviewer,
  TraceTitle,
  TraceToken,
} from '../EditTraceCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { Context as NotificationContext } from '../../contextProviders/NotificationModalProvider';
import { authenticateUser } from '../../lib/middleware';
import TraceItem from '../../models/TraceItem';
import LPTrace from '../../models/LPTrace';
import Trace from '../../models/Trace';
import { TraceService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';
import UploadPicture from '../UploadPicture';
import config from '../../configuration';
import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import BridgedTrace from '../../models/BridgedTrace';
import { TraceSave } from '../../lib/traceSave';

const WAIT_INTERVAL = 1000;

function EditTraceOld(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    actions: { minPayoutWarningInCreatEdit },
  } = useContext(NotificationContext);
  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

  const { traceId } = props.match.params;

  const [editedForm, setEditedForm] = useState({});
  const [initialValues, setInitialValues] = useState({});
  const [expenseItems, setExpenseItems] = useState([]);
  const [trace, setTrace] = useState();
  const [campaign, setCampaign] = useState();
  const [totalAmount, setTotalAmount] = useState(new BigNumber(0));
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAmount, setLoadingAmount] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('Propose');
  const [loadingRate, setLoadingRate] = useState(false);

  const traceHasFunded = trace && trace.donationCounters && trace.donationCounters.length > 0;

  const isProposed =
    trace && trace.status && [Trace.PROPOSED, Trace.REJECTED].includes(trace.status);

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText('Update Trace');
    }
  }, [loadingAmount, userIsCampaignOwner]);

  const itemAmountMap = useRef({});
  const timer = useRef();
  const isMounted = useRef(true);
  const conversionRateTimestamp = useRef();

  const updateTotalAmount = () => {
    setTotalAmount(BigNumber.sum(...Object.values(itemAmountMap.current)));
  };

  const updateStateOfItem = (name, value, itemKey) => {
    if (name === 'amount') {
      itemAmountMap.current[itemKey] = value;
      updateTotalAmount();
    } else {
      const item = expenseItems.find(i => i.key === itemKey);
      item[name] = value;

      setExpenseItems([...expenseItems]);
      if (name === 'loadingAmount') {
        if (value) {
          setLoadingAmount(true);
        } else {
          setLoadingAmount(expenseItems.some(i => i.key !== itemKey && i.loadingAmount));
        }
      }
    }
  };

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      if (name === 'acceptsAnyToken') {
        setEditedForm({
          ...editedForm,
          [name]: checked,
          isCapped: checked ? false : editedForm.isCapped,
        });
      } else {
        setEditedForm({ ...editedForm, [name]: checked });
      }
      if (name === 'isLPTrace') {
        let ms;
        if (!checked) {
          ms = new BridgedTrace(trace.toFeathers());
        } else {
          ms = new LPTrace({
            ...trace.toFeathers(),
            recipientId: trace.campaign.projectId,
            recipientAddress: undefined,
          });
        }
        ms.itemizeState = editedForm.itemizeState;
        ms._id = trace.id;
        setTrace(ms);
      }
    } else {
      setEditedForm({ ...editedForm, [name]: value });
    }
  };

  const handleSelectCurrency = (_, option) => {
    handleInputChange({ target: { name: 'currency', value: option.value } });
  };

  const handleDatePicker = dateString => {
    handleInputChange({ target: { name: 'date', value: dateString } });
  };

  function setReviewer(_, option) {
    handleInputChange({
      target: { name: 'reviewerAddress', value: option.value },
    });
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'image', value: address } });
  }

  const handleSelectToken = token => {
    handleInputChange({ target: { name: 'token', value: token } });
  };

  function addExpense() {
    setExpenseItems([
      ...expenseItems,
      // New one
      {
        fiatAmount: 0,
        currency: '',
        date: getStartOfDayUTC().subtract(1, 'd'),
        conversionRate: 1,
        conversionRateTimestamp: new Date().toISOString(),
        description: '',
        picture: '',
        key: uuidv4(),
        loadingAmount: false,
      },
    ]);
  }

  function removeExpense(key) {
    const filteredExpenseItems = expenseItems.filter(item => item.key !== key);
    setExpenseItems([...filteredExpenseItems]);
    delete itemAmountMap.current[key];
    updateTotalAmount();
  }

  function goBack() {
    history.goBack();
  }

  const isEditNotAllowed = ms => {
    return (
      !(
        isOwner(ms.owner.address, currentUser) ||
        isOwner(ms.campaign.ownerAddress, currentUser) ||
        isOwner(ms.campaign.coownerAddress, currentUser)
      ) || ms.donationCounters.length > 0
    );
  };

  const updateSingleAmount = () => {
    const { token, currency, date, fiatAmount, isCapped } = editedForm;
    if (!token.symbol || !currency || !isCapped) return;

    setLoadingAmount(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      try {
        setLoadingRate(true);
        const res = await getConversionRates(date, token.symbol, currency);
        const rate = res.rates[currency];
        if (rate && isMounted.current) {
          conversionRateTimestamp.current = res.timestamp;
          handleInputChange({
            target: {
              name: 'maxAmount',
              value: new BigNumber(fiatAmount).div(rate),
            },
          });
        } else {
          throw new Error('Rate not found');
        }
      } catch (e) {
        const message = `Sadly we were unable to get the exchange rate. Please try again after refresh.`;

        ErrorHandler(e, message);
        handleInputChange({
          target: { name: 'maxAmount', value: new BigNumber(0) },
        });
      } finally {
        setLoadingRate(false);
        setLoadingAmount(false);
      }
    }, WAIT_INTERVAL);
  };

  useEffect(() => {
    if (editedForm.token) updateSingleAmount();
  }, [editedForm.token, editedForm.fiatAmount, editedForm.date, editedForm.currency]);

  useEffect(() => {
    if (currentUser.address) {
      authenticateUser(currentUser, false, web3).then(auth => {
        if (!auth) history.goBack();
      });
    }
    if (trace) {
      setUserIsOwner(
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
      );
      if (isEditNotAllowed(trace)) {
        ErrorHandler({}, 'You are not allowed to edit.');
        goBack();
      }
    } else if (currentUser.address) {
      TraceService.get(traceId)
        .then(res => {
          if (isEditNotAllowed(res)) {
            ErrorHandler({}, 'You are not allowed to edit.');
            goBack();
          } else {
            const traceImage = res.image ? res.image.match(/\/ipfs\/.*/)[0] : '';
            const iValues = {
              title: res.title,
              token: res.token,
              recipientAddress: res.recipientAddress,
              description: res.description,
              image: traceImage,
              donateToCommunity: !!res.communityId,
              reviewerAddress: res.reviewerAddress,
              hasReviewer: !!res.reviewerAddress,
              isLPTrace: res instanceof LPTrace,
              isCapped: res.isCapped,
              acceptsAnyToken: res.token.symbol === ANY_TOKEN.symbol,
              itemizeState: res.itemizeState,
              currency: res.selectedFiatType,
              fiatAmount: res.fiatAmount ? res.fiatAmount.toNumber() : 0,
              date: res.date,
            };
            const items = [];
            res.items.forEach(_item => {
              const item = {};
              item.fiatAmount = _item.fiatAmount ? _item.fiatAmount.toNumber() : 0;
              item.currency = _item.selectedFiatType;
              item.token = _item.token;
              item.date = _item.date;
              item.conversionRate = _item.conversionRate;
              item.conversionRateTimestamp = _item.conversionRateTimestamp;
              item.description = _item.description;
              item.key = uuidv4();
              item.loadingAmount = false;
              const imageUrl = _item.image ? _item.image.match(/\/ipfs\/.*/)[0] : '';
              item.picture = imageUrl;
              items.push(item);
            });
            const _campaign = res.campaign;
            setExpenseItems(items);
            setInitialValues(iValues);
            setEditedForm(iValues);
            setTrace(res);
            setCampaign(_campaign);
            setUserIsOwner(
              [_campaign.ownerAddress, _campaign.coownerAddress].includes(currentUser.address),
            );
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Trace details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.address]);

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false, web3);

    if (!authenticated) return;

    if (userIsCampaignOwner && !isForeignNetwork) {
      displayForeignNetRequiredWarning();
      return;
    }

    const {
      title,
      description,
      reviewerAddress,
      hasReviewer,
      image,
      token,
      recipientAddress,
      donateToCommunity,
      acceptsAnyToken,
      isCapped,
      maxAmount,
      date,
      fiatAmount,
      currency,
      itemizeState,
      isLPTrace,
    } = editedForm;

    const newTrace = trace;

    newTrace.image = image;
    newTrace.reviewerAddress = hasReviewer ? reviewerAddress : ZERO_ADDRESS;
    newTrace.parentProjectId = campaign.projectId;
    newTrace.title = title;
    newTrace.description = description;
    newTrace.recipientAddress = isLPTrace ? undefined : recipientAddress;
    newTrace.token = token;

    if (donateToCommunity) {
      newTrace.communityId = config.defaultCommunityId;
    }

    if (acceptsAnyToken) {
      newTrace.maxAmount = undefined;
      newTrace.itemizeState = false;
    } else if (isCapped) {
      if (itemizeState) {
        newTrace.fiatAmount = new BigNumber(0);
        newTrace.selectedFiatType = '';
        newTrace.itemizeState = true;
        newTrace.maxAmount = totalAmount;
        newTrace.items = expenseItems.map(expenseItem => {
          const amount = itemAmountMap.current[expenseItem.key];
          return new TraceItem({
            ...expenseItem,
            amount,
            image: expenseItem.picture,
            selectedFiatType: expenseItem.currency,
            wei: utils.toWei(amount.toFixed()),
          });
        });
      } else {
        newTrace.itemizeState = false;
        newTrace.items = [];
        newTrace.maxAmount = maxAmount;
        newTrace.date = date;
        newTrace.fiatAmount = new BigNumber(fiatAmount);
        newTrace.selectedFiatType = currency;
        newTrace.conversionRateTimestamp = conversionRateTimestamp.current;
      }
    }

    // TODO: We should have ability to delete fiatAmount for uncapped traces
    newTrace.status = isProposed || trace.status === Trace.REJECTED ? Trace.PROPOSED : trace.status; // make sure not to change status!

    setLoading(true);

    TraceSave({
      trace: newTrace,
      userIsCampaignOwner,
      campaign,
      minPayoutWarningInCreatEdit,
      web3,
      from: currentUser.address,
      afterSave: () => setLoading(false),
      onError: () => setLoading(false),
    });
  };

  return (
    <Fragment>
      <Web3ConnectWarning />
      <div id="create-trace-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header"
              onBack={goBack}
              title="Edit Trace"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            {campaign && (
              <Form
                className="card-form"
                requiredMark
                onFinish={submit}
                initialValues={initialValues}
                scrollToFirstError={{
                  block: 'center',
                  behavior: 'smooth',
                }}
              >
                <div className="card-form-header">
                  <img src={`${process.env.PUBLIC_URL}/img/expense.png`} alt="expense-logo" />
                  <div className="title">Trace</div>
                </div>

                <TraceCampaignInfo campaign={campaign} />

                <TraceTitle
                  onChange={handleInputChange}
                  value={editedForm.title}
                  extra="What is the purpose of this trace?"
                  disabled={traceHasFunded}
                />

                <TraceDescription
                  onChange={handleInputChange}
                  value={editedForm.description}
                  extra="Describe how you are going to execute this trace successfully..."
                  placeholder="e.g. Monthly salary"
                  id="description"
                  disabled={traceHasFunded}
                />

                <UploadPicture
                  setPicture={setPicture}
                  picture={editedForm.image}
                  imgAlt={editedForm.title}
                  label="Add a picture"
                />

                <TraceDonateToCommunity
                  value={editedForm.donateToCommunity}
                  onChange={handleInputChange}
                  disabled={!isProposed}
                />

                <TraceReviewer
                  traceType="Enable Trace"
                  setReviewer={setReviewer}
                  hasReviewer={editedForm.hasReviewer}
                  toggleHasReviewer={handleInputChange}
                  initialValue={initialValues.reviewerAddress}
                  traceReviewerAddress={editedForm.reviewerAddress}
                  disabled={!isProposed}
                />

                <div className="trace-donate-community mb-3">
                  <Checkbox
                    className="trace-reviewer-checkbox"
                    name="isLPTrace"
                    checked={editedForm.isLPTrace}
                    onChange={handleInputChange}
                    disabled={!isProposed}
                  >
                    Raise funds for Campaign: {campaign.title}
                  </Checkbox>
                </div>
                <TraceRecipientAddress
                  label="Reimburse to wallet address"
                  onChange={handleInputChange}
                  value={editedForm.recipientAddress}
                  disabled={!isProposed || editedForm.isLPTrace}
                />

                <div className="section">
                  <div className="title">Reimbursement options</div>
                  <Checkbox
                    name="acceptsAnyToken"
                    checked={editedForm.acceptsAnyToken}
                    onChange={handleInputChange}
                    disabled={!isProposed}
                    style={{ fontSize: '16px' }}
                    className="mb-3"
                  >
                    Accept donations in all tokens
                  </Checkbox>
                </div>

                <Checkbox
                  name="isCapped"
                  checked={editedForm.isCapped}
                  onChange={handleInputChange}
                  disabled={!isProposed || editedForm.acceptsAnyToken}
                  style={{ fontSize: '16px' }}
                  className="mb-3"
                >
                  Enable Trace fundraising cap
                </Checkbox>

                <br />

                <Checkbox
                  name="itemizeState"
                  checked={editedForm.itemizeState}
                  onChange={handleInputChange}
                  disabled={!isProposed || !editedForm.isCapped}
                  style={{ fontSize: '16px' }}
                  className="mb-3"
                >
                  Add multiple expenses, invoices or items
                </Checkbox>

                {editedForm.isCapped && !editedForm.itemizeState && (
                  <Fragment>
                    <TraceFiatAmountCurrency
                      onCurrencyChange={handleSelectCurrency}
                      onAmountChange={handleInputChange}
                      amount={editedForm.fiatAmount}
                      currency={editedForm.currency}
                      disabled={loadingRate || !isProposed}
                      initialValues={{
                        selectedFiatType: initialValues.currency,
                        fiatAmount: initialValues.fiatAmount,
                      }}
                    />
                    <TraceDatePicker
                      onChange={handleDatePicker}
                      value={editedForm.date}
                      disabled={loadingRate || !isProposed}
                    />
                  </Fragment>
                )}

                {editedForm.isCapped && editedForm.itemizeState && (
                  <div className="section mb-4">
                    <div className="title">Expense details</div>
                    {expenseItems.map((item, idx) => (
                      <CreateExpenseItem
                        key={item.key}
                        item={item}
                        id={idx}
                        updateStateOfItem={updateStateOfItem}
                        removeExpense={removeExpense}
                        removeAble={expenseItems.length > 1}
                        token={editedForm.token}
                        disabled={!isProposed}
                      />
                    ))}
                    <Button
                      disabled={!isProposed}
                      onClick={addExpense}
                      block
                      size="large"
                      type="primary"
                      ghost
                    >
                      Add new Expense
                    </Button>
                  </div>
                )}

                <TraceToken
                  label="Reimburse in Currency"
                  onChange={handleSelectToken}
                  value={editedForm.token}
                  totalAmount={convertEthHelper(
                    editedForm.itemizeState ? totalAmount : editedForm.maxAmount,
                    editedForm.token.decimals,
                  )}
                  initialValue={initialValues.token}
                  disabled={!isProposed || editedForm.acceptsAnyToken}
                  hideTotalAmount={!editedForm.isCapped}
                />

                <Form.Item className="mt-5">
                  <Button
                    block
                    size="large"
                    type="primary"
                    htmlType="submit"
                    loading={loading || loadingAmount}
                  >
                    {submitButtonText}
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

EditTraceOld.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default EditTraceOld;
