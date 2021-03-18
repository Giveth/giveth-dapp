import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Button, Checkbox, Col, Form, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
// import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  MilestoneCampaignInfo,
  MilestoneDatePicker,
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestoneFiatAmountCurrency,
  MilestonePicture,
  MilestoneRecipientAddress,
  MilestoneTitle,
  MilestoneToken,
} from '../EditMilestoneCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';

function CreatePayment(props) {
  // const {
  //   state: { fiatTypes, currentRate, isLoading },
  //   actions: { getConversionRates, convertMultipleRates },
  // } = useContext(ConversionRateContext);
  const {
    state: { fiatWhitelist },
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
    token: {},
    date: '',
    description: '',
    picture: '',
    donateToDac: true,
    recipientAddress: '',
    nolimit: false,
  });

  useEffect(() => {
    if (currentUser.address && !payment.recipientAddress) {
      setPayment({
        ...payment,
        recipientAddress: currentUser.address,
      });
      form.setFieldsValue({ recipientAddress: currentUser.address });
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

  function handleSelectToken(_, option) {
    handleInputChange({
      target: { name: 'token', value: option.value },
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
                    <MilestoneFiatAmountCurrency
                      onCurrencyChange={handleSelectCurrency}
                      onAmountChange={handleInputChange}
                      amount={payment.amount}
                      currency={payment.currency}
                    />
                    <MilestoneDatePicker onChange={handleDatePicker} value={payment.date} />
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
                <MilestoneToken
                  label="Payment currency"
                  onChange={handleSelectToken}
                  includeAnyToken={payment.nolimit}
                  totalAmount="0"
                />

                <MilestoneRecipientAddress
                  label="Pay to wallet address"
                  onChange={handleInputChange}
                  value={payment.recipientAddress}
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
