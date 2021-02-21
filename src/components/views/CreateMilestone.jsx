import React, { Fragment, useState } from 'react';
import { PageHeader, Row, Col, Form, Input, Upload, Checkbox, Switch, Select, Button } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import ImgCrop from 'antd-img-crop';
import useCampaign from '../../hooks/useCampaign';

function CreateMilestone(props) {
  const campaign = useCampaign(props.match.params.id);
  const [milestone, setMilstone] = useState({
    title: '',
    description: '',
    picture: '',
    donate: true,
    hasReviewer: true,
    reviewer: '',
  });

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setMilstone({ ...milestone, [name]: checked });
    } else {
      setMilstone({ ...milestone, [name]: value });
    }
  };

  function toggleHasReviewer(checked) {
    handleInputChange({ target: { name: 'hasReviewer', value: checked } });
  }

  function setReviewer(_, option) {
    handleInputChange({ target: { name: 'reviewer', value: option.value } });
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
    <div id="create-milestone-view">
      <Row>
        <Col span={24}>
          <PageHeader
            className="site-page-header my-test"
            onBack={goBack}
            title="Create New Milestone"
            ghost={false}
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
              <div className="content">{campaign && campaign.title}</div>
            </div>
            <div className="section">
              <div className="title">Milestone details</div>
              <Form.Item name="title" label="Title" className="custom-form-item">
                <Input
                  value={milestone.title}
                  name="title"
                  placeholder="e.g. Support continued Development"
                  onChange={handleInputChange}
                  required
                />
              </Form.Item>
              <div className="form-item-desc">
                What are you going to accomplish in this Milestone?
              </div>
              <Form.Item name="milestoneDesc" label="Description" className="custom-form-item">
                <Input.TextArea
                  value={milestone.description}
                  name="description"
                  placeholder="Describe how you are going to execute this milestone successfully..."
                  onChange={handleInputChange}
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
                A picture says more than a thousand words. Select a png or jpg file in a 1:1 aspect
                ratio.
              </div>
              <Form.Item name="milestoneDonate" className="custom-form-item donate-giveth">
                <Checkbox onChange={handleInputChange} name="donate" checked={milestone.donate}>
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
                  checked={milestone.hasReviewer}
                  onChange={toggleHasReviewer}
                />
                <span className="milestone-reviewer-label">Milestone reviewer</span>
              </Form.Item>
              {milestone.hasReviewer && (
                <Fragment>
                  <Form.Item>
                    <Select
                      showSearch
                      placeholder="Select a reviewer"
                      optionFilterProp="children"
                      name="reviewer"
                      onSelect={setReviewer}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      value={milestone.reviewer}
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
                <strong>{` ${campaign && campaign.title} `}</strong>
                Campaign address. As a preventative measure, please confirm that someone working on
                the project has access to funds that are sent to this address!
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
