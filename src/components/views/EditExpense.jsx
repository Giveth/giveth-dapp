import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import BigNumber from 'bignumber.js';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { utils } from 'web3';

import CreateExpenseItem from '../CreateExpenseItem';
import { convertEthHelper, getStartOfDayUTC, history, isOwner } from '../../lib/helpers';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  TraceCampaignInfo,
  TraceRecipientAddress,
  TraceTitle,
  TraceToken,
} from '../EditTraceCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { Context as NotificationContext } from '../../contextProviders/NotificationModalProvider';
import { authenticateUser } from '../../lib/middleware';
import TraceItem from '../../models/TraceItem';
import Trace from '../../models/Trace';
import { TraceService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';
import { sendAnalyticsTracking } from '../../lib/SegmentAnalytics';

function EditExpense(props) {
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

  const { traceId } = props.match.params;

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    token: {},
    recipientAddress: '',
  });
  const [initialValues, setInitialValues] = useState();
  const [expenseItems, setExpenseItems] = useState([
    {
      fiatAmount: 0,
      currency: '',
      token: {},
      date: getStartOfDayUTC().subtract(1, 'd'),
      conversionRate: 1,
      conversionRateTimestamp: new Date().toISOString(),
      description: '',
      picture: '',
      key: uuidv4(),
      loadingAmount: false,
    },
  ]);
  const [trace, setTrace] = useState();
  const [campaign, setCampaign] = useState();
  const [totalAmount, setTotalAmount] = useState(new BigNumber(0));
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAmount, setLoadingAmount] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('Propose');

  const traceHasFunded = trace && trace.donationCounters && trace.donationCounters.length > 0;

  const isProposed =
    trace && trace.status && [Trace.PROPOSED, Trace.REJECTED].includes(trace.status);

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText('Update Payment');
    }
  }, [loadingAmount, userIsCampaignOwner]);

  const [form] = Form.useForm();

  const itemAmountMap = useRef({});

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
      setExpenseForm({ ...expenseForm, [name]: checked });
    } else {
      setExpenseForm({ ...expenseForm, [name]: value });
    }
  };

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
      ms.formType !== Trace.EXPENSETYPE ||
      !(
        isOwner(ms.owner.address, currentUser) ||
        isOwner(ms.campaign.ownerAddress, currentUser) ||
        isOwner(ms.campaign.coownerAddress, currentUser)
      ) ||
      ms.donationCounters.length > 0
    );
  };

  useEffect(() => {
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
            const iValues = {
              title: res.title,
              token: res.token,
              recipientAddress: res.recipientAddress,
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
            setExpenseForm(iValues);
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

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const { title, recipientAddress, token } = expenseForm;

      const ms = trace;

      ms.parentProjectId = campaign.projectId;
      ms.title = title;
      ms.recipientAddress = recipientAddress;
      ms.token = token;
      ms.maxAmount = totalAmount;

      // TODO: We should have ability to delete fiatAmount for uncapped traces
      ms.status = isProposed || trace.status === Trace.REJECTED ? Trace.PROPOSED : trace.status; // make sure not to change status!

      ms.items = expenseItems.map(expenseItem => {
        const amount = itemAmountMap.current[expenseItem.key];
        return new TraceItem({
          ...expenseItem,
          amount,
          image: expenseItem.picture,
          selectedFiatType: expenseItem.currency,
          wei: utils.toWei(amount.toFixed()),
        });
      });

      setLoading(true);

      await TraceService.save({
        trace: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          const analyticsData = {
            title: ms.title,
            slug: res.slug,
            parentCampaignAddress: campaign.ownerAddress,
            traceRecipientAddress: res.recipientAddress,
            ownerAddress: ms.ownerAddress,
            traceType: ms.formType,
            parentCampaignId: campaign.id,
            parentCampaignTitle: campaign.title,
            reviewerAddress: ms.reviewerAddress,
            recipientAddress: ms.recipientAddress,
            userAddress: currentUser.address,
          };

          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Expense proposed to the Campaign Owner';
              sendAnalyticsTracking('Trace Edit', {
                action: 'updated proposed',
                ...analyticsData,
              });
            } else {
              notificationDescription = 'The Expense has been updated!';
              sendAnalyticsTracking('Trace Edit', {
                action: 'updated proposed',
                ...analyticsData,
              });
            }
          } else if (txUrl) {
            notificationDescription = (
              <p>
                Your Expense is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
            sendAnalyticsTracking('Trace Edit', {
              action: 'created',
              ...analyticsData,
            });
          } else {
            notificationDescription = 'Your Expense has been updated!';
            sendAnalyticsTracking('Trace Edit', {
              action: 'updated proposed',
              ...analyticsData,
            });
          }

          if (notificationDescription) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaign._id}/traces/${res._id}`);
        },
        afterMined: (created, txUrl) => {
          notification.success({
            description: (
              <p>
                Your Expense has been updated!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            ),
          });
        },
        onError(message, err, isLessThanMinPayout) {
          setLoading(false);
          if (isLessThanMinPayout) {
            return minPayoutWarningInCreatEdit();
          }
          return ErrorHandler(err, message);
        },
        web3,
      });
    }
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
              title="Edit Expense"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            {campaign && (
              <Form
                className="card-form"
                form={form}
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
                  <div className="title">Expense</div>
                </div>

                <TraceCampaignInfo campaign={campaign} />

                <TraceTitle
                  onChange={handleInputChange}
                  value={expenseForm.title}
                  extra="What is the purpose of these expenses?"
                  disabled={traceHasFunded}
                />

                <div className="section">
                  <div className="title">Expense details</div>
                  {expenseItems.map((item, idx) => (
                    <CreateExpenseItem
                      key={item.key}
                      item={item}
                      id={idx}
                      updateStateOfItem={updateStateOfItem}
                      removeExpense={removeExpense}
                      removeAble={expenseItems.length > 1}
                      token={expenseForm.token}
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

                <div className="section">
                  <div className="title">Reimbursement options</div>

                  <TraceToken
                    label="Reimburse in Currency"
                    onChange={handleSelectToken}
                    value={expenseForm.token}
                    totalAmount={convertEthHelper(totalAmount, expenseForm.token.decimals)}
                    initialValue={initialValues.token}
                    disabled={!isProposed}
                  />

                  <TraceRecipientAddress
                    label="Reimburse to wallet address"
                    onChange={handleInputChange}
                    value={expenseForm.recipientAddress}
                    disabled={!isProposed}
                  />
                </div>
                <Form.Item>
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

EditExpense.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default EditExpense;
