import React, { useEffect, useState } from 'react';
import {
  PageHeader,
  Row,
  Col,
  Form,
  Input,
  Upload,
  Checkbox,
  Select,
  Button,
  DatePicker,
} from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import ImgCrop from 'antd-img-crop';
import CampaignService from '../../services/CampaignService';

function CreatePayment(props) {
  const currencies = [
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

  const [campaign, setCampaign] = useState();
  const [payment, setPayment] = useState({
    amount: '',
    currency: '',
    paymentCurrency: '',
    date: '',
    description: '',
    picture: '',
    donate: true,
    wallet: '',
  });

  useEffect(async () => {
    async function getCampaign() {
      const campaignId = props.match.params.id;
      const camp = await CampaignService.get(campaignId);
      setCampaign(camp);
    }
    getCampaign();
  }, []);

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

  const uploadProps = {
    multiple: false,
    accept: 'image/png, image/jpeg',
    fileList: [],
    customRequest: options => {
      const { onSuccess, onError, file, onProgress } = options;
      console.log(file);
      onProgress(0);
      if (true) {
        // upload to ipfs
        onSuccess('ipfs Address');
        onProgress(100);
      } else {
        onError('Failed!');
      }
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        console.log(`${info.file.name} file uploaded successfully.`);
        setPicture(info.file.response);
      } else if (status === 'error') {
        console.log(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div id="create-payment-view">
      <Row>
        <Col span={24}>
          <PageHeader
            className="site-page-header my-test"
            onBack={goBack}
            title="Create New Payment"
          />
        </Col>
      </Row>
      <Row>
        <div className="card-form-container">
          <Form
            className="card-form"
            initialValues={{
              currency: currencies[0],
            }}
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
                  <Form.Item name="currency" label="Currency" className="custom-form-item">
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
                      {currencies.map(cur => (
                        <Select.Option key={cur} value={cur}>
                          {cur}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <div className="form-item-desc">Select the currency of this expense.</div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col className="gutter-row" span={10}>
                  <Form.Item name="date" label="Date" className="custom-form-item">
                    <DatePicker onChange={handleDatePicker} value={payment.date} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="description"
                label="Description of the payment request"
                className="custom-form-item"
              >
                <Input.TextArea
                  value={payment.description}
                  name="description"
                  placeholder="e.g. Monthly salary"
                  onChange={handleInputChange}
                  required
                />
              </Form.Item>
              <Form.Item
                name="picture"
                label="Add a picture (optional)"
                className="custom-form-item"
              >
                <ImgCrop>
                  <Upload.Dragger {...uploadProps}>
                    <p className="ant-upload-text">
                      Drag and Drop JPEG, PNG here or <span>Attach a file.</span>
                    </p>
                  </Upload.Dragger>
                </ImgCrop>
              </Form.Item>
              <div className="form-item-desc">
                A picture says more than a thousand words. Select a png or jpg file in a 1:1 aspect
                ratio.
              </div>
              <Form.Item name="donate" className="custom-form-item donate-giveth">
                <Checkbox onChange={handleInputChange} name="donate" checked={payment.donate}>
                  Donate 3% to Giveth
                </Checkbox>
              </Form.Item>
              <div className="form-item-desc">
                Your help keeps Giveth alive.
                <span role="img" aria-label="heart">
                  {' '}
                  ❤️
                </span>
              </div>
            </div>
            <div className="section">
              <div className="title">Payment options</div>
              <Form.Item
                name="paymentCurrency"
                label="Payment currency"
                className="custom-form-item"
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
                  {currencies.map(cur => (
                    <Select.Option key={cur} value={cur}>
                      {cur}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <div className="form-item-desc">Select the token you want to be reimbursed in.</div>
              <Form.Item name="wallet" label="Pay to wallet address" className="custom-form-item">
                <Input
                  value={payment.wallet}
                  name="wallet"
                  placeholder="0x"
                  onChange={handleInputChange}
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
