import React, { useContext, useState, Fragment } from 'react';
import { PageHeader, Row, Col, Form, Input, Select, Button, Typography } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import ExpenseCreateForm from '../ExpenseCreateForm';
import useCampaign from '../../hooks/useCampaign';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import { MilestoneCampaignInfo, MilestoneTitle } from '../EditMilestoneCommons';

function CreateExpense(props) {
  const {
    state: { activeTokenWhitelist },
  } = useContext(WhiteListContext);
  const campaign = useCampaign(props.match.params.id);
  const [expenseForm, setExpenseForm] = useState({
    expenses: [
      {
        amount: '',
        currency: '',
        date: '',
        description: '',
        picture: '',
        key: uuidv4(),
      },
    ],
    title: '',
    reimbursementCurrency: undefined,
    wallet: undefined,
  });

  function updateStateOfexpenses(name, value, expKey) {
    const expenses = [...expenseForm.expenses];
    const expense = expenses.find(exp => exp.key === expKey);
    expense[name] = value;

    setExpenseForm({ ...setExpenseForm, expenses });
  }
  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setExpenseForm({ ...expenseForm, [name]: checked });
    } else {
      setExpenseForm({ ...expenseForm, [name]: value });
    }
  };

  function handleSelectReimbursementCurrency(_, option) {
    handleInputChange({
      target: { name: 'reimbursementCurrency', value: option.value },
    });
  }

  function addExpense() {
    setExpenseForm({
      ...expenseForm,
      expenses: [
        ...expenseForm.expenses,
        {
          amount: '',
          currency: '',
          date: '',
          description: '',
          picture: '',
          key: uuidv4(),
        },
      ],
    });
  }

  function goBack() {
    props.history.goBack();
  }

  const submit = async () => {};

  return (
    <Fragment>
      <Web3ConnectWarning />

      <div id="create-milestone-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header my-test"
              onBack={goBack}
              title="Create New Expense"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form className="card-form" requiredMark onFinish={submit}>
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

              <div className="title">Expense details</div>
              {expenseForm.expenses.map((expense, idx) => (
                <ExpenseCreateForm
                  key={expense.key}
                  expense={expense}
                  id={idx}
                  updateStateOfexpenses={updateStateOfexpenses}
                />
              ))}
              <Button onClick={addExpense} className="add-expense-button">
                Add new Expense
              </Button>

              <div className="section">
                <div className="title">Reimbursement options</div>
                <Form.Item
                  name="reimbursementCurrency"
                  label="Reimburse in Currency"
                  className="custom-form-item"
                  extra="Select the token you want to be reimbursed in."
                >
                  <Row gutter={16} align="middle">
                    <Col className="gutter-row" span={12}>
                      <Select
                        showSearch
                        placeholder="Select a Currency"
                        optionFilterProp="children"
                        name="reimbursementCurrency"
                        onSelect={handleSelectReimbursementCurrency}
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={expenseForm.reimbursementCurrency}
                        required
                      >
                        {activeTokenWhitelist.map(token => (
                          <Select.Option key={token.name} value={token.name}>
                            {token.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Col>
                    <Col className="gutter-row" span={12}>
                      <Typography.Text className="ant-form-text" type="secondary">
                        ≈ 0.006544 ETH
                      </Typography.Text>
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item
                  name="wallet"
                  label="Reimburse to wallet address"
                  className="custom-form-item"
                  extra="If you don’t change this field the address associated with your account will be
                used."
                >
                  <Input
                    value={expenseForm.wallet}
                    name="wallet"
                    placeholder="0x"
                    onChange={handleInputChange}
                    required
                  />
                </Form.Item>
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
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default CreateExpense;
