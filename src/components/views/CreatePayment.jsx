import React, { Component } from 'react';
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

class CreatePayment extends Component {
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
      amount: undefined,
      currency: undefined,
      paymentCurrency: undefined,
      date: undefined,
      description: '',
      picture: '',
      donate: true,
      wallet: undefined,
    };
    this.goBack = this.goBack.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.toggleHasReviewer = this.toggleHasReviewer.bind(this);
    this.handleSelectCurrency = this.handleSelectCurrency.bind(this);
    this.handleSelectPaymentCurrency = this.handleSelectPaymentCurrency.bind(this);
    this.handleDatePicker = this.handleDatePicker.bind(this);
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

  toggleHasReviewer(checked) {
    this.setState({ hasReviewer: checked });
  }

  handleSelectCurrency(_, option) {
    this.setState({ currency: option.value });
  }

  handleSelectPaymentCurrency(_, option) {
    this.setState({ paymentCurrency: option.value });
  }

  handleDatePicker(_, dateString) {
    this.setState({ date: dateString });
  }

  goBack() {
    this.props.history.push(`/campaigns/${this.props.match.params.id}`);
  }

  render() {
    const {
      campaign,
      amount,
      currency,
      date,
      description,
      // picture,
      donate,
      paymentCurrency,
      wallet,
    } = this.state;
    const self = this;
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
        console.log('info', info);
        const { status } = info.file;
        if (status !== 'uploading') {
          console.log(info.file, info.fileList);
        }
        if (status === 'done') {
          console.log(`${info.file.name} file uploaded successfully.`);
          self.setState({ picture: info.file.response });
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
              onBack={this.goBack}
              title="Create New Payment"
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form className="card-form">
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/payment.png`} alt="payment-logo" />
                <div className="title">Payment</div>
              </div>
              <div className="campaign-info">
                <div className="lable">Campaign</div>
                <div className="content">{campaign.title}</div>
              </div>
              <div className="section">
                <div className="title">Payment details</div>
                <Row gutter={16}>
                  <Col className="gutter-row" span={10}>
                    <Form.Item name="amount" label="Amount" className="custom-form-item">
                      <Input
                        value={amount}
                        name="amount"
                        type="number"
                        placeholder="Enter Amount"
                        onChange={this.handleInputChange}
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
                        onSelect={this.handleSelectCurrency}
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={currency}
                        required
                      >
                        {this.currencies.map(cur => (
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
                      <DatePicker onChange={this.handleDatePicker} value={date} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="description"
                  label="Description of the payment request"
                  className="custom-form-item"
                >
                  <Input.TextArea
                    value={description}
                    name="description"
                    placeholder="e.g. Monthly salary"
                    onChange={this.handleInputChange}
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
                  A picture says more than a thousand words. Select a png or jpg file in a 1:1
                  aspect ratio.
                </div>
                <Form.Item name="donate" className="custom-form-item donate-giveth">
                  <Checkbox onChange={this.handleInputChange} name="donate" checked={donate}>
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
                    onSelect={this.handleSelectPaymentCurrency}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    value={paymentCurrency}
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
                <Form.Item name="wallet" label="Pay to wallet address" className="custom-form-item">
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

CreatePayment.propTypes = {
  // currentUser: PropTypes.instanceOf(User),
  // location: PropTypes.shape().isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  // isProposed: PropTypes.bool,
  // isNew: PropTypes.bool,
  // balance: PropTypes.instanceOf(BigNumber).isRequired,
  // isForeignNetwork: PropTypes.bool.isRequired,
  // displayForeignNetRequiredWarning: PropTypes.func.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
  // getConversionRates: PropTypes.func.isRequired,
  // currentRate: PropTypes.shape({
  //   rates: PropTypes.shape().isRequired,
  //   timestamp: PropTypes.string.isRequired,
  // }),
  // conversionRateLoading: PropTypes.bool.isRequired,
  // fiatTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  // isCampaignManager: PropTypes.func.isRequired,
  // reviewers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  // tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

export default CreatePayment;
