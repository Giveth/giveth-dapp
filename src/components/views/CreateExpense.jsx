import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import BigNumber from 'bignumber.js';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { utils } from 'web3';
import CreateExpenseItem from '../CreateExpenseItem';
import useCampaign from '../../hooks/useCampaign';
import { convertEthHelper, getStartOfDayUTC, history, ZERO_ADDRESS } from '../../lib/helpers';
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
import BridgedMilestone from '../../models/BridgedMilestone';
import { Milestone, MilestoneItem } from '../../models';
import { MilestoneService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';

function CreateExpense(props) {
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

  const { id: campaignId, slug: campaignSlug } = props.match.params;
  const campaign = useCampaign(campaignId, campaignSlug);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    token: {},
    recipientAddress: '',
    description: 'Expense items describes what has been paid or should be paid',
  });
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
  const [totalAmount, setTotalAmount] = useState(new BigNumber(0));
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAmount, setLoadingAmount] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('Propose');

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText(userIsCampaignOwner ? 'Create' : 'Propose');
    }
  }, [loadingAmount, userIsCampaignOwner]);

  const [form] = Form.useForm();

  const itemAmountMap = useRef({});

  useEffect(() => {
    if (currentUser.address && !expenseForm.recipientAddress) {
      setExpenseForm({
        ...expenseForm,
        recipientAddress: currentUser.address,
      });
      form.setFieldsValue({ recipientAddress: currentUser.address });
    }
  }, [currentUser]);

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

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const { title, description, recipientAddress, token } = expenseForm;

      const ms = new BridgedMilestone({
        title,
        description,
        recipientAddress,
        token,
        image: '/img/expenseProject.png',
        reviewerAddress: ZERO_ADDRESS,
      });

      ms.ownerAddress = currentUser.address;
      ms.campaignId = campaign._id;
      ms.parentProjectId = campaign.projectId;
      ms.formType = Milestone.EXPENSETYPE;

      ms.maxAmount = totalAmount;

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

      if (!userIsCampaignOwner) {
        ms.status = Milestone.PROPOSED;
      }

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
            const notificationError =
              'It seems your Expense has been updated!, this should not be happened';
            notification.error({ description: notificationError });
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
                Your Expense has been created!
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
              title="Create New Expense"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form
              className="card-form"
              form={form}
              requiredMark
              onFinish={submit}
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
                  />
                ))}
                <Button onClick={addExpense} block size="large" type="primary" ghost>
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
                />

                <MilestoneRecipientAddress
                  label="Reimburse to wallet address"
                  onChange={handleInputChange}
                  value={expenseForm.recipientAddress}
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
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

CreateExpense.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default CreateExpense;
