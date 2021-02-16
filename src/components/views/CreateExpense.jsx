import React, { Component } from 'react';
import { PageHeader, Row, Col, Form, Input, Select, Button } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import CampaignService from '../../services/CampaignService';
import ExpenseCreateForm from '../ExpenseCreateForm';

class CreateExpense extends Component {
  constructor(props) {
    super(props);
    this.currencies = [
      'ETH',
      'DAI',
      'PAN',
      'BTC',
      'USDC',
      'USD',
      'AUD',
      'BRL',
      'CAD',
      'CHF',
      'CZK',
      'EUR',
      'GBP',
      'MXN',
      'THB',
    ];
    this.state = {
      campaign: {},
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
      reimbursementCurrency: undefined,
      wallet: undefined,
    };
    this.goBack = this.goBack.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectReimbursementCurrency = this.handleSelectReimbursementCurrency.bind(this);
    this.addExpense = this.addExpense.bind(this);
    this.updateStateOfexpenses = this.updateStateOfexpenses.bind(this);
  }

  async componentDidMount() {
    const campaignId = this.props.match.params.id;
    const campaign = await CampaignService.get(campaignId);
    this.setState({
      campaign,
    });
  }

  componentDidUpdate() {
    console.log(this.state);
  }

  handleInputChange(event) {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;
    this.setState({
      [name]: value,
    });
  }

  updateStateOfexpenses(name, value, expKey) {
    const expenses = [...this.state.expenses];
    const expense = expenses.find(exp => exp.key === expKey);
    expense[name] = value;

    this.setState({ expenses: [...expenses] });
  }

  handleSelectReimbursementCurrency(_, option) {
    this.setState({ reimbursementCurrency: option.value });
  }

  addExpense() {
    this.setState(prevState => ({
      expenses: [
        ...prevState.expenses,
        {
          amount: '',
          currency: '',
          date: '',
          description: '',
          picture: '',
          key: uuidv4(),
        },
      ],
    }));
  }

  goBack() {
    this.props.history.push(`/campaigns/${this.props.match.params.id}/new`);
  }

  render() {
    const {
      campaign,
      expenses,
      // picture,
      reimbursementCurrency,
      wallet,
    } = this.state;
    return (
      <div id="create-expense-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header my-test"
              onBack={this.goBack}
              title="Create New Expense"
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form className="card-form">
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/expense.png`} alt="expense-logo" />
                <div className="title">Expense</div>
              </div>
              <div className="campaign-info">
                <div className="lable">Campaign</div>
                <div className="content">{campaign.title}</div>
              </div>
              {expenses.map((expense, idx) => (
                <ExpenseCreateForm
                  key={expense.key}
                  expense={expense}
                  id={idx}
                  updateStateOfexpenses={this.updateStateOfexpenses}
                />
              ))}
              <Button onClick={this.addExpense}>Add new Expense</Button>

              <div className="section">
                <div className="title">Reimbursement options</div>
                <Form.Item
                  name="reimbursementCurrency"
                  label="Reimburse in Currency"
                  className="custom-form-item"
                >
                  <Select
                    showSearch
                    placeholder="Select a Currency"
                    optionFilterProp="children"
                    name="reimbursementCurrency"
                    onSelect={this.handleSelectReimbursementCurrency}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    value={reimbursementCurrency}
                    required
                  >
                    {this.currencies.map(cur => (
                      <Select.Option key={cur} value={cur}>
                        {cur}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <div className="form-item-desc">Select the token you want to be reimbursed in.</div>
                <Form.Item
                  name="wallet"
                  label="Reimburse to wallet address"
                  className="custom-form-item"
                >
                  <Input
                    value={wallet}
                    name="wallet"
                    placeholder="0x"
                    onChange={this.handleInputChange}
                    required
                  />
                </Form.Item>
                <div className="form-item-desc">
                  If you don’t change this field the address associated with your account will be
                  used.
                </div>
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
    );
  }
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
