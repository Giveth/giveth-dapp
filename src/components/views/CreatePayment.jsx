import React, { useContext, useState, useEffect, Fragment } from 'react';
import { PageHeader, Row, Col, Form, Input, Select, Button, DatePicker, Checkbox } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
// import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  MilestoneCampaignInfo,
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestonePicture,
  MilestoneTitle,
} from '../EditMilestoneCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';

function CreatePayment(props) {
  // const {
  //   state: { fiatTypes, currentRate, isLoading },
  //   actions: { getConversionRates, convertMultipleRates },
  // } = useContext(ConversionRateContext);
  const {
    state: { activeTokenWhitelist, fiatWhitelist },
  } = useContext(WhiteListContext);

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [form] = Form.useForm();

  const { id: campaignId, slug: campaignSlug } = props.match.params;
  const campaign = useCampaign(campaignId, campaignSlug);

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
    nolimit: false,
  });

  useEffect(() => {
    if (currentUser.address && !payment.recipientAddress) {
      setPayment({
        ...payment,
        wallet: currentUser.address,
      });
      form.setFieldsValue({ wallet: currentUser.address });
    }
  }, [currentUser]);

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
              form={form}
            >
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/payment.png`} alt="payment-logo" />
                <div className="title">Payment</div>
              </div>

              <MilestoneCampaignInfo campaign={campaign} />

              <MilestoneTitle
                value={payment.title}
                onChange={handleInputChange}
                extra="What are you going to accomplish in this Milestone?"
              />

              <div className="section">
                <div className="title">Payment details</div>

                <Row>
                  <Form.Item className="custom-form-item">
                    <Checkbox name="nolimit" checked={payment.nolimit} onChange={handleInputChange}>
                      No limits
                    </Checkbox>
                  </Form.Item>
                </Row>
                {!payment.nolimit && (
                  <Fragment>
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
                  </Fragment>
                )}

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
                    {payment.nolimit && (
                      <Select.Option key="ANY_TOKEN" value="ANY_TOKEN">
                        Any Token
                      </Select.Option>
                    )}
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
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default CreatePayment;
