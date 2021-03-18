import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Col, Form, PageHeader, Row } from 'antd';
import BigNumber from 'bignumber.js';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import CreateExpenseItem from '../CreateExpenseItem';
import useCampaign from '../../hooks/useCampaign';
import { convertEthHelper, getStartOfDayUTC, history } from '../../lib/helpers';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  MilestoneCampaignInfo,
  MilestoneRecipientAddress,
  MilestoneTitle,
  MilestoneToken,
} from '../EditMilestoneCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';

function CreateExpense(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isLoading: whiteListLoading, activeTokenWhitelist },
  } = useContext(WhiteListContext);
  const { id: campaignId, slug: campaignSlug } = props.match.params;
  const campaign = useCampaign(campaignId, campaignSlug);
  const [expenseForm, setExpenseForm] = useState({
    expenseItems: [
      {
        fiatAmount: 0,
        currency: '',
        date: getStartOfDayUTC().subtract(1, 'd'),
        description: '',
        picture: '',
        key: uuidv4(),
        amount: new BigNumber(0),
      },
    ],
    title: '',
    token: {},
    recipientAddress: '',
  });
  const [totalAmount, setTotalAmount] = useState('0');

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
    if (!whiteListLoading && activeTokenWhitelist.length > 0) {
      setExpenseForm({
        ...expenseForm,
        token: activeTokenWhitelist[0],
      });
    }
  }, [whiteListLoading, activeTokenWhitelist]);

  function updateTotalAmount() {
    setTotalAmount(
      convertEthHelper(
        BigNumber.sum(...Object.values(itemAmountMap.current)),
        expenseForm.token.decimals,
      ),
    );
  }

  function updateStateOfItem(name, value, itemKey) {
    console.log({ name, value, itemKey });
    if (name === 'amount') {
      itemAmountMap.current[itemKey] = value;
      updateTotalAmount();
    } else {
      const expenseItems = [...expenseForm.expenseItems];
      const item = expenseItems.find(i => i.key === itemKey);
      item[name] = value;

      console.log(expenseItems);
      setExpenseForm({ ...expenseForm, expenseItems });
    }
  }

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setExpenseForm({ ...expenseForm, [name]: checked });
    } else {
      setExpenseForm({ ...expenseForm, [name]: value });
    }
  };

  function handleSelectToken(_, option) {
    handleInputChange({
      target: {
        name: 'token',
        value: activeTokenWhitelist.find(t => t.symbol === option.value),
      },
    });
  }

  function addExpense() {
    setExpenseForm({
      ...expenseForm,
      expenseItems: [
        ...expenseForm.expenseItems,
        {
          fiatAmount: 0,
          currency: '',
          date: getStartOfDayUTC().subtract(1, 'd'),
          description: '',
          picture: '',
          key: uuidv4(),
          amount: new BigNumber(0),
        },
      ],
    });
  }

  function removeExpense(key) {
    const filteredExpenseItems = expenseForm.expenseItems.filter(item => item.key !== key);
    setExpenseForm({
      ...expenseForm,
      expenseItems: filteredExpenseItems,
    });

    delete itemAmountMap.current[key];
    updateTotalAmount();
  }

  function goBack() {
    history.goBack();
  }

  const submit = async () => {};

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
            <Form className="card-form" form={form} requiredMark onFinish={submit}>
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
                {expenseForm.expenseItems.map((item, idx) => (
                  <CreateExpenseItem
                    key={item.key}
                    item={item}
                    id={idx}
                    updateStateOfItem={updateStateOfItem}
                    removeExpense={removeExpense}
                    removeAble={expenseForm.expenseItems.length > 1}
                    token={expenseForm.token}
                  />
                ))}
                <Button onClick={addExpense} className="add-expense-button">
                  Add new Expense
                </Button>
              </div>

              <div className="section">
                <div className="title">Reimbursement options</div>

                <MilestoneToken
                  label="Reimburse in Currency"
                  onChange={handleSelectToken}
                  value={expenseForm.token}
                  totalAmount={totalAmount}
                />

                <MilestoneRecipientAddress
                  label="Reimburse to wallet address"
                  onChange={handleInputChange}
                  value={expenseForm.recipientAddress}
                />
              </div>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="submit-button">
                  Submit
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
