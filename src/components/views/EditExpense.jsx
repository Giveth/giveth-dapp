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
  MilestoneCampaignInfo,
  MilestoneRecipientAddress,
  MilestoneTitle,
  MilestoneToken,
} from '../EditMilestoneCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { Context as NotificationContext } from '../../contextProviders/NotificationModalProvider';
import { authenticateUser } from '../../lib/middleware';
import { Milestone, MilestoneItem } from '../../models';
import { MilestoneService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';

function EditExpense(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    actions: { displayMinPayoutWarning },
  } = useContext(NotificationContext);

  const { milestoneId } = props.match.params;

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
  const [milestone, setMilestone] = useState();
  const [campaign, setCampaign] = useState();
  const [totalAmount, setTotalAmount] = useState(new BigNumber(0));
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAmount, setLoadingAmount] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('Propose');

  const milestoneHasFunded =
    milestone && milestone.donationCounters && milestone.donationCounters.length > 0;

  const isProposed =
    milestone &&
    milestone.status &&
    [Milestone.PROPOSED, Milestone.REJECTED].includes(milestone.status);

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText('Update Payment');
    }
  }, [loadingAmount, userIsCampaignOwner]);

  const [form] = Form.useForm();

  const itemAmountMap = useRef({});

  useEffect(() => {
    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign, currentUser]);

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
      ms.formType !== Milestone.EXPENSETYPE ||
      !(isOwner(ms.owner.address, currentUser) || isOwner(ms.campaign.ownerAddress, currentUser)) ||
      ms.donationCounters.length > 0
    );
  };

  useEffect(() => {
    if (milestone) {
      if (isEditNotAllowed(milestone)) {
        goBack();
      }
    } else if (currentUser.id) {
      MilestoneService.get(milestoneId)
        .then(res => {
          if (isEditNotAllowed(res)) {
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
            setExpenseItems(items);
            setInitialValues(iValues);
            setExpenseForm(iValues);
            setMilestone(res);
            setCampaign(res.campaign);
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Milestone details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.id]);

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const { title, recipientAddress, token } = expenseForm;

      const ms = milestone;

      ms.parentProjectId = campaign.projectId;
      ms.title = title;
      ms.recipientAddress = recipientAddress;
      ms.token = token;
      ms.maxAmount = totalAmount;

      // TODO: We should have ability to delete fiatAmount for uncapped milestones
      ms.status =
        isProposed || milestone.status === Milestone.REJECTED
          ? Milestone.PROPOSED
          : milestone.status; // make sure not to change status!

      ms.items = expenseItems.map(expenseItem => {
        const amount = itemAmountMap.current[expenseItem.key];
        return new MilestoneItem({
          ...expenseItem,
          amount,
          image: expenseItem.picture,
          selectedFiatType: expenseItem.currency,
          wei: utils.toWei(amount.toFixed()),
        });
      });

      setLoading(true);

      await MilestoneService.save({
        milestone: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Expense proposed to the Campaign Owner';
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
          } else {
            notificationDescription = 'Your Expense has been updated!';
          }

          if (notificationDescription) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaign._id}/milestones/${res._id}`);
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
        onError(message, err, minimumPayoutUsdValue) {
          setLoading(false);
          if (minimumPayoutUsdValue) {
            return displayMinPayoutWarning({
              minimumPayoutUsdValue,
              type: 'Creat/Edit',
            });
          }
          return ErrorHandler(err, message);
        },
      });
    }
  };

  return (
    <Fragment>
      <Web3ConnectWarning />
      <div id="create-milestone-view">
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

                <MilestoneCampaignInfo campaign={campaign} />

                <MilestoneTitle
                  onChange={handleInputChange}
                  value={expenseForm.title}
                  extra="What is the purpose of these expenses?"
                  disabled={milestoneHasFunded}
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

                  <MilestoneToken
                    label="Reimburse in Currency"
                    onChange={handleSelectToken}
                    value={expenseForm.token}
                    totalAmount={convertEthHelper(totalAmount, expenseForm.token.decimals)}
                    initialValue={initialValues.token}
                    disabled={!isProposed}
                  />

                  <MilestoneRecipientAddress
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
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default EditExpense;
