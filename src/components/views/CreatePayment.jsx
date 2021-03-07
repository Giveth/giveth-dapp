import React, { useContext, useState, Fragment } from 'react';
import { Checkbox, PageHeader, Row, Col, Form, Input, Select, Button, DatePicker } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
// import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestonePicture,
  MilestoneTitle,
} from '../EditMilestoneCommons';

function CreatePayment(props) {
  // const {
  //   state: { fiatTypes, currentRate, isLoading },
  //   actions: { getConversionRates, convertMultipleRates },
  // } = useContext(ConversionRateContext);
  const {
    state: { activeTokenWhitelist, fiatWhitelist },
  } = useContext(WhiteListContext);

  const campaign = useCampaign(props.match.params.id);
  const [payment, setPayment] = useState({
    title: '',
    amount: '',
    currency: '',
    paymentCurrency: '',
    date: '',
    description: '',
    picture: '',
    donateToDac: true,
    wallet: '',
  });

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setPayment({ ...payment, [name]: checked });
    } else {
      setPayment({ ...payment, [name]: value });
    }
  };

  function handleSelectCurrency(_, option) {
    handleInputChange({ target: { name: 'currency', value: option.value } });
  }

  function handleSelectPaymentCurrency(_, option) {
    handleInputChange({
      target: { name: 'paymentCurrency', value: option.value },
    });
  }

  function handleDatePicker(_, dateString) {
    handleInputChange({ target: { name: 'date', value: dateString } });
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function goBack() {
    props.history.goBack();
  }

  function handleLimitChange() {
    handleInputChange({
      target: { name: 'noLimits', type: 'checkbox', checked: !payment.noLimits },
    });
    if (!payment.noLimits) {
      activeTokenWhitelist.push({ name: 'Any Token' });
    } else {
      activeTokenWhitelist.pop();
    }
  }

  const submit = async () => {};

  return (
    <Fragment>
      <Web3ConnectWarning />
      <div id="create-payment-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header"
              onBack={goBack}
              title="Create New Payment"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form
              className="card-form"
              requiredMark
              initialValues={{
                currency: fiatWhitelist[0] || 'USD',
              }}
              onFinish={submit}
            >
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/payment.png`} alt="payment-logo" />
                <div className="title">Payment</div>
              </div>

              <div className="campaign-info">
                <div className="lable">Campaign</div>
                <div className="content">{campaign && campaign.title}</div>
              </div>

              <div className="section">
                <div className="title">Payment details</div>

                <Checkbox onChange={handleLimitChange} name="noLimits" checked={payment.noLimits}>
                  No limits
                </Checkbox>

                <MilestoneTitle
                  value={payment.title}
                  onChange={handleInputChange}
                  extra="What are you going to accomplish in this Milestone?"
                />

                <Row gutter={16}>
                  <Col className="gutter-row" span={10}>
                    <Form.Item name="amount" label="Amount" className="custom-form-item">
                      <Input
                        value={payment.amount}
                        name="amount"
                        type="number"
                        placeholder="Enter Amount"
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Item>
                  </Col>
                  <Col className="gutter-row" span={10}>
                    <Form.Item
                      name="currency"
                      label="Currency"
                      className="custom-form-item"
                      extra="Select the currency of this expense."
                    >
                      <Select
                        showSearch
                        placeholder="Select a Currency"
                        optionFilterProp="children"
                        name="currency"
                        onSelect={handleSelectCurrency}
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={payment.currency}
                        required
                      >
                        {fiatWhitelist.map(cur => (
                          <Select.Option key={cur} value={cur}>
                            {cur}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col className="gutter-row" span={10}>
                    <Form.Item name="date" label="Date" className="custom-form-item">
                      <DatePicker onChange={handleDatePicker} value={payment.date} />
                    </Form.Item>
                  </Col>
                </Row>

                <MilestoneDescription
                  onChange={handleInputChange}
                  value={payment.description}
                  extra="Describe how you are going to execute this milestone successfully..."
                  placeholder="e.g. Monthly salary"
                />

                <MilestonePicture
                  setPicture={setPicture}
                  milestoneTitle={payment.title}
                  picture={payment.picture}
                />

                <MilestoneDonateToDac value={payment.donateToDac} onChange={handleInputChange} />
              </div>
              <div className="section">
                <div className="title">Payment options</div>
                <Form.Item
                  name="paymentCurrency"
                  label="Payment currency"
                  className="custom-form-item"
                  extra="Select the token you want to be reimbursed in."
                >
                  <Select
                    showSearch
                    placeholder="Select a Currency"
                    optionFilterProp="children"
                    name="paymentCurrency"
                    onSelect={handleSelectPaymentCurrency}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    value={payment.paymentCurrency}
                    required
                  >
                    {activeTokenWhitelist.map(cur => (
                      <Select.Option key={cur.name} value={cur.name}>
                        {cur.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="wallet"
                  label="Pay to wallet address"
                  className="custom-form-item"
                  extra="If you don’t change this field the address associated with your account will be
                used."
                >
                  <Input
                    value={payment.wallet}
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

CreatePayment.propTypes = {
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

export default CreatePayment;
