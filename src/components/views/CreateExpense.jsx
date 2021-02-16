import React, { Component } from 'react';
import { PageHeader, Row, Col, Form, Input, Upload, Select, Button, DatePicker } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import ImgCrop from 'antd-img-crop';
import CampaignService from '../../services/CampaignService';

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
      amount: undefined,
      currency: undefined,
      date: undefined,
      description: '',
      picture: '',
      reimbursementCurrency: undefined,
      wallet: undefined,
    };
    this.goBack = this.goBack.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.toggleHasReviewer = this.toggleHasReviewer.bind(this);
    this.handleSelectCurrency = this.handleSelectCurrency.bind(this);
    this.handleSelectReimbursementCurrency = this.handleSelectReimbursementCurrency.bind(this);
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

  handleSelectReimbursementCurrency(_, option) {
    this.setState({ reimbursementCurrency: option.value });
  }

  handleDatePicker(_, dateString) {
    this.setState({ date: dateString });
  }

  goBack() {
    this.props.history.push(`/campaigns/${this.props.match.params.id}/new`);
  }

  render() {
    const {
      campaign,
      amount,
      currency,
      date,
      description,
      // picture,
      reimbursementCurrency,
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
              <div className="section">
                <div className="title">Expense details</div>
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
                    <div className="form-item-desc">
                      The amount should be the same as on the receipt.
                    </div>
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
                  label="Description of the expense"
                  className="custom-form-item"
                >
                  <Input.TextArea
                    value={description}
                    name="description"
                    placeholder="e.g. Lunch"
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
              </div>
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
