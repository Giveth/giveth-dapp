import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  PageHeader,
  Row,
  Select,
  Switch,
  Upload,
  notification,
} from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import ImgCrop from 'antd-img-crop';
import { DeleteTwoTone } from '@ant-design/icons';
import useCampaign from '../../hooks/useCampaign';
import { ANY_TOKEN, history, ZERO_ADDRESS } from '../../lib/helpers';
import useReviewers from '../../hooks/useReviewers';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import LPMilestone from '../../models/LPMilestone';
import { Milestone } from '../../models';
import { IPFSService, MilestoneService } from '../../services';
import config from '../../configuration';
import { authenticateUser } from '../../lib/middleware';
import ErrorHandler from '../../lib/ErrorHandler';

function CreateMilestone(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const campaignId = props.match.params.id;

  const campaign = useCampaign(campaignId);
  const reviewers = useReviewers();

  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    picture: '',
    donateToDac: true,
    hasReviewer: true,
    reviewerAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);

  useEffect(() => {
    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign, currentUser]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setMilestone({ ...milestone, [name]: checked });
    } else {
      setMilestone({ ...milestone, [name]: value });
    }
  };

  function toggleHasReviewer(checked) {
    handleInputChange({ target: { name: 'hasReviewer', value: checked } });
  }

  function setReviewer(_, option) {
    handleInputChange({
      target: { name: 'reviewerAddress', value: option.value },
    });
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function goBack() {
    history.goBack();
  }

  const uploadProps = {
    multiple: false,
    accept: 'image/png, image/jpeg',
    fileList: [],
    customRequest: options => {
      const { onSuccess, onError, file, onProgress } = options;
      onProgress(0);
      IPFSService.upload(file)
        .then(address => {
          onSuccess(address.slice(6));
          onProgress(100);
        })
        .catch(err => {
          onError('Failed!', err);
        });
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        console.log('file uploaded successfully.', info.file.response);
        setPicture(info.file.response);
      } else if (status === 'error') {
        console.log(`${info.file.name} file upload failed.`);
        const args = {
          message: 'Error',
          description: 'Cannot upload picture to IPFS',
        };
        notification.error(args);
      }
    },
  };

  function removePicture() {
    setPicture('');
  }

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const { title, description, reviewerAddress, hasReviewer } = milestone;
      const ms = new LPMilestone({
        title,
        description,
        reviewerAddress: hasReviewer ? reviewerAddress : ZERO_ADDRESS,
        recipientId: campaign.projectId,
        token: ANY_TOKEN,
      });

      ms.ownerAddress = currentUser.address;
      ms.campaignId = campaignId;
      ms.parentProjectId = campaign.projectId;

      if (milestone.donateToDac) {
        ms.dacId = config.defaultDacId;
      }

      if (!userIsCampaignOwner) {
        ms.status = Milestone.PROPOSED;
      }

      setLoading(true);

      await MilestoneService.save({
        milestone: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Milestone proposed to the Campaign Owner';
            }
          } else if (txUrl) {
            notificationDescription = (
              <p>
                Your Milestone is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
          } else {
            notificationDescription = 'Your Milestone has been updated!';
          }

          if (description) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaignId}/milestones/${res._id}`);
        },
        afterMined: (created, txUrl) => {
          notification.success({
            description: (
              <p>
                Your Milestone has been created!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            ),
          });
        },
        onError(message, err) {
          setLoading(false);
          return ErrorHandler(err, message);
        },
      });
    }
  };

  return (
    <Fragment>
      <Web3ConnectWarning />
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
            <Form className="card-form" requiredMark onFinish={submit}>
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
                <Form.Item
                  name="title"
                  label="Title"
                  className="custom-form-item"
                  extra="What are you going to accomplish in this Milestone?"
                  rules={[
                    {
                      required: true,
                      type: 'string',
                      min: 3,
                      message: 'Please provide at least 3 characters',
                    },
                  ]}
                >
                  <Input
                    value={milestone.title}
                    name="title"
                    placeholder="e.g. Support continued Development"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item
                  name="milestoneDesc"
                  label="Description"
                  className="custom-form-item"
                  extra="Explain how you are going to do this successfully."
                  rules={[
                    {
                      required: true,
                      type: 'string',
                      min: 10,
                      message:
                        'Please provide at least 10 characters and do not edit the template keywords.',
                    },
                  ]}
                >
                  <Input.TextArea
                    value={milestone.description}
                    name="description"
                    placeholder="Describe how you are going to execute this milestone successfully..."
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item
                  name="picture"
                  label="Add a picture (optional)"
                  className="custom-form-item"
                  extra="A picture says more than a thousand words. Select a png or jpg file in a 1:1
                  aspect ratio."
                >
                  <Fragment>
                    {milestone.picture ? (
                      <div className="picture-upload-preview">
                        <img
                          src={`${config.ipfsGateway}${milestone.picture}`}
                          alt={milestone.title}
                        />
                        <DeleteTwoTone onClick={removePicture} />
                      </div>
                    ) : (
                      <ImgCrop>
                        <Upload.Dragger {...uploadProps}>
                          <p className="ant-upload-text">
                            Drag and Drop JPEG, PNG here or <span>Attach a file.</span>
                          </p>
                        </Upload.Dragger>
                      </ImgCrop>
                    )}
                  </Fragment>
                </Form.Item>
                <Form.Item
                  className="custom-form-item milestone-donate-dac"
                  valuePropName="checked"
                  extra={
                    <div>
                      Your help keeps Giveth alive.
                      <span role="img" aria-label="heart">
                        {' '}
                        ❤️
                      </span>
                    </div>
                  }
                >
                  <Checkbox
                    onChange={handleInputChange}
                    name="donateToDac"
                    checked={milestone.donateToDac}
                  >
                    Donate 3% to Giveth
                  </Checkbox>
                </Form.Item>
                <Form.Item className="custom-form-item milestone-reviewer" valuePropName="checked">
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
                    <Form.Item
                      name="reviewerAddress"
                      rules={[{ required: true }]}
                      extra="The reviewer verifies that the Milestone is completed successfully."
                    >
                      <Select
                        showSearch
                        placeholder="Select a reviewer"
                        optionFilterProp="children"
                        name="reviewerAddress"
                        onSelect={setReviewer}
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={milestone.reviewerAddress}
                      >
                        {reviewers.map(({ name, address }) => (
                          <Select.Option
                            key={address}
                            value={address}
                          >{`${name} - ${address}`}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Fragment>
                )}
                <div className="milestone-desc">
                  Contributions to this milestone will be sent directly to the
                  <strong>{` ${campaign && campaign.title} `}</strong>
                  Campaign address. As a preventative measure, please confirm that someone working
                  on the project has access to funds that are sent to this address!
                </div>
              </div>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {userIsCampaignOwner ? 'Create' : 'Propose'}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

CreateMilestone.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) => prevProps.match.params.id === nextProps.match.params.id;

export default memo(CreateMilestone, isEqual);
