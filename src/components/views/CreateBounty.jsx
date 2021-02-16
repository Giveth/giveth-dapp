import React, { Component, Fragment } from 'react';
import { PageHeader, Row, Col, Form, Input, Upload, Checkbox, Switch, Select, Button } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import ImgCrop from 'antd-img-crop';
import CampaignService from '../../services/CampaignService';

class CreateBounty extends Component {
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
      title: '',
      description: '',
      picture: '',
      donate: true,
      hasReviewer: true,
      reviewer: undefined,
      amount: undefined,
      currency: undefined,
    };
    this.goBack = this.goBack.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.toggleHasReviewer = this.toggleHasReviewer.bind(this);
    this.handleSelectReviewer = this.handleSelectReviewer.bind(this);
    this.handleSelectCurrency = this.handleSelectCurrency.bind(this);
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

  handleSelectReviewer(_, option) {
    this.setState({ reviewer: option.value });
  }

  handleSelectCurrency(_, option) {
    this.setState({ currency: option.value });
  }

  goBack() {
    this.props.history.push(`/campaigns/${this.props.match.params.id}/new`);
  }

  render() {
    const {
      campaign,
      title,
      description,
      donate,
      hasReviewer,
      reviewer,
      amount,
      currency,
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
      <div id="create-bounty-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header my-test"
              onBack={this.goBack}
              title="Create New Bounty"
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form className="card-form">
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/bounty.png`} alt="bounty-logo" />
                <div className="title">Bounty</div>
              </div>
              <div className="campaign-info">
                <div className="lable">Campaign</div>
                <div className="content">{campaign.title}</div>
              </div>
              <div className="section">
                <div className="title">Bounty details</div>
                <Form.Item name="title" label="Title" className="custom-form-item">
                  <Input
                    value={title}
                    name="title"
                    placeholder="e.g. Support continued Development"
                    onChange={this.handleInputChange}
                    required
                  />
                </Form.Item>
                <div className="form-item-desc">What is this Bopunty about?</div>
                <Form.Item name="description" label="Description" className="custom-form-item">
                  <Input.TextArea
                    value={description}
                    name="description"
                    placeholder="Describe the Bounty and define the acceptance criteria..."
                    onChange={this.handleInputChange}
                    required
                  />
                </Form.Item>
                <div className="form-item-desc">
                  Explain the requirements and what success looks like.
                </div>
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
                <Form.Item className="custom-form-item bounty-reviewer">
                  <Switch
                    defaultChecked
                    name="hasReviewer"
                    checked={hasReviewer}
                    onChange={this.toggleHasReviewer}
                  />
                  <span className="bounty-reviewer-label">Bounty reviewer</span>
                </Form.Item>
                {hasReviewer && (
                  <Fragment>
                    <Form.Item>
                      <Select
                        showSearch
                        placeholder="Select a reviewer"
                        optionFilterProp="children"
                        name="reviewer"
                        onSelect={this.handleSelectReviewer}
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={reviewer}
                      >
                        <Select.Option value="jack">Jack</Select.Option>
                        <Select.Option value="lucy">Lucy</Select.Option>
                        <Select.Option value="tom">Tom</Select.Option>
                      </Select>
                    </Form.Item>
                    <div className="form-item-desc">
                      The reviewer verifies that the Bounty is completed successfully.
                    </div>
                  </Fragment>
                )}
              </div>
              <div className="section">
                <div className="title">Bounty reward</div>
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
                    <div className="form-item-desc">Select the currency of this bounty.</div>
                  </Col>
                </Row>
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

CreateBounty.propTypes = {
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

export default CreateBounty;
