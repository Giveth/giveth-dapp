import React, { Component, Fragment } from 'react';
import { PageHeader, Row, Col, Form, Input, Upload, Checkbox, Switch, Select, Button } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import ImgCrop from 'antd-img-crop';
import CampaignService from '../../services/CampaignService';

class CreateMilestone extends Component {
  constructor(props) {
    super(props);
    this.state = {
      campaign: {},
      title: '',
      description: '',
      picture: '',
      donate: true,
      hasReviewer: true,
      reviewer: undefined,
    };
    this.goBack = this.goBack.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.toggleHasReviewer = this.toggleHasReviewer.bind(this);
    this.handleSelectReviewer = this.handleSelectReviewer.bind(this);
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

  goBack() {
    this.props.history.push(`/campaigns/${this.props.match.params.id}`);
  }

  render() {
    const { campaign, title, description, donate, hasReviewer, reviewer } = this.state;
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
      <div id="create-milestone-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header my-test"
              onBack={this.goBack}
              title="Create New Milestone"
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form className="card-form">
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/milestone.png`} alt="milestone-logo" />
                <div className="title">Milestone</div>
              </div>
              <div className="campaign-info">
                <div className="lable">Campaign</div>
                <div className="content">{campaign.title}</div>
              </div>
              <div className="section">
                <div className="title">Milestone details</div>
                <Form.Item name="title" label="Title" className="custom-form-item">
                  <Input
                    value={title}
                    name="title"
                    placeholder="e.g. Support continued Development"
                    onChange={this.handleInputChange}
                    required
                  />
                </Form.Item>
                <div className="form-item-desc">
                  What are you going to accomplish in this Milestone?
                </div>
                <Form.Item name="milestoneDesc" label="Description" className="custom-form-item">
                  <Input.TextArea
                    value={description}
                    name="description"
                    placeholder="Describe how you are going to execute this milestone successfully..."
                    onChange={this.handleInputChange}
                    required
                  />
                </Form.Item>
                <div className="form-item-desc">
                  Explain how you are going to do this successfully.
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
                <Form.Item name="milestoneDonate" className="custom-form-item donate-giveth">
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
                <Form.Item className="custom-form-item milestone-reviewer">
                  <Switch
                    defaultChecked
                    name="hasReviewer"
                    checked={hasReviewer}
                    onChange={this.toggleHasReviewer}
                  />
                  <span className="milestone-reviewer-label">Milestone reviewer</span>
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
                      The reviewer verifies that the Milestone is completed successfully.
                    </div>
                  </Fragment>
                )}
                <div className="milestone-desc">
                  Contributions to this milestone will be sent directly to the
                  <strong>{` ${campaign.title} `}</strong>
                  Campaign address. As a preventative measure, please confirm that someone working
                  on the project has access to funds that are sent to this address!
                </div>
              </div>
              <Form.Item>
                <Button type="primary" htmlType="submit">
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

CreateMilestone.propTypes = {
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

export default CreateMilestone;
