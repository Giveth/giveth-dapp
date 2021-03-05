import React, { useEffect, useContext, Fragment, useState } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import 'react-input-token/lib/style.css';

import {
  Button,
  Col,
  Form,
  notification,
  PageHeader,
  Row,
  Input,
  Upload,
  Select,
  Typography,
} from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import Loader from '../Loader';
import { isOwner, history, getHtmlText } from '../../lib/helpers';
import {
  checkForeignNetwork,
  checkBalance,
  authenticateUser,
  checkProfile,
} from '../../lib/middleware';
import CampaignService from '../../services/CampaignService';
import ErrorPopup from '../ErrorPopup';
import ErrorHandler from '../../lib/ErrorHandler';

import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../../contextProviders/UserProvider';

import Web3ConnectWarning from '../Web3ConnectWarning';
import Editor from '../Editor';

import { IPFSService } from '../../services';
import config from '../../configuration';

const { Title, Text } = Typography;

/**
 * View to create or edit a Campaign
 *
 * @param isNew    If set, component will load an empty model.
 *                 Otherwise component expects an id param and will load a campaign object
 * @param id       URL parameter which is an id of a campaign object
 */
const EditCampaignV2 = ({
  isNew,
  isForeignNetwork,
  displayForeignNetRequiredWarning,
  match,
  balance,
}) => {
  const {
    state: { currentUser, isLoading: userIsLoading },
  } = useContext(UserContext);

  const {
    state: { reviewers, projectOwnersWhitelistEnabled, isLoading: whitelistIsLoading },
  } = useContext(WhiteListContext);

  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [campaign, setCampaign] = useState({});

  function checkUser() {
    if (!currentUser) {
      history.push('/');
      return Promise.reject();
    }

    return authenticateUser(currentUser, true)
      .then(() => {
        if (!currentUser.isProjectOwner && !projectOwnersWhitelistEnabled) {
          throw new Error('not whitelisted');
        }
      })
      .then(() => checkProfile(currentUser))
      .then(() => checkBalance(balance));
  }

  useEffect(() => {
    if (userIsLoading || whitelistIsLoading) {
      return;
    }
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() => checkUser())
      .then(() => {
        // Load this Campaign
        if (!isNew) {
          CampaignService.get(match.params.id)
            .then(camp => {
              if (isOwner(camp.ownerAddress, currentUser)) {
                setCampaign(camp);
                setIsLoading(false);
              } else history.goBack();
            })
            .catch(err => {
              if (err.status === 404) {
                history.push('/notfound');
              } else {
                setIsLoading(false);
                ErrorHandler(
                  err,
                  'There has been a problem loading the Campaign. Please refresh the page and try again.',
                );
              }
            });
        } else {
          if (!currentUser.isProjectOwner) {
            history.goBack();
          }
          setCampaign({ owner: currentUser });
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined && err.message !== 'wrongNetwork') {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }, [userIsLoading, whitelistIsLoading]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setCampaign({ ...campaign, [name]: checked });
    } else {
      setCampaign({ ...campaign, [name]: value });
    }
    setIsBlocking(true);
  };

  const onDescriptionChange = description => {
    handleInputChange({ target: { name: 'description', value: description } });
  };

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function setReviewer(_, option) {
    handleInputChange({
      target: { name: 'reviewerAddress', value: option.value },
    });
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
          onSuccess(address);
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

  function goBack() {
    history.goBack();
  }

  function submit() {}

  return (
    <Fragment>
      <Web3ConnectWarning />
      <Prompt
        when={isBlocking}
        message={() =>
          `You have unsaved changes. Are you sure you want to navigate from this page?`
        }
      />
      {isLoading ? (
        <Loader className="fixed" />
      ) : (
        <div id="create-Campaint-view">
          <Row>
            <Col span={24}>
              <PageHeader
                className="site-page-header"
                onBack={goBack}
                title={isNew ? 'Create New Campaign' : `Edit Campaign ${campaign.title}`}
                ghost={false}
              />
            </Col>
          </Row>
          <Row>
            <div className="card-form-container">
              <Form className="card-form" requiredMark onFinish={submit}>
                <Title level={3}>Start a new Campaign!</Title>
                <Text>
                  A Campaign solves a specific cause by executing a project via its Milestones.
                  Funds raised by a Campaign need to be delegated to its Milestones in order to be
                  paid out.
                </Text>
                <Form.Item
                  name="title"
                  label="What are you working on?"
                  className="custom-form-item"
                  extra="Describe your Campaign in 1 sentence."
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
                    value={campaign.title}
                    name="title"
                    placeholder="e.g. Support continued Development"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item
                  name="description"
                  label="Explain how you are going to do this successfully."
                  className="custom-form-item"
                  extra="Make it as extensive as necessary. Your goal is to build trust, so that people donate Ether to your Campaign."
                  rules={[
                    {
                      required: true,
                      type: 'string',
                    },
                    () => ({
                      validator(_, val) {
                        if (!val || getHtmlText(campaign.description).length > 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Please provide at least 10 characters'));
                      },
                    }),
                  ]}
                >
                  <Editor
                    name="description"
                    onChange={onDescriptionChange}
                    value={campaign.description}
                    placeholder="Describe how you're going to execute your Campaign successfully..."
                  />
                </Form.Item>
                <Form.Item
                  name="picture"
                  label="Add a picture"
                  className="custom-form-item"
                  rules={[{ required: true }]}
                  extra="A picture says more than a thousand words. Select a png or jpg file in a 1:1
                    aspect ratio."
                >
                  <Fragment>
                    {campaign.picture ? (
                      <div className="picture-upload-preview">
                        <img
                          src={`${config.ipfsGateway}${campaign.picture.slice(6)}`}
                          alt={campaign.title}
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
                  name="communityUrl"
                  label="Url to join your Community"
                  className="custom-form-item"
                  extra="Where can people join your Community? Giveth redirects people there."
                  rules={[
                    {
                      type: 'string',
                      min: 3,
                      message: 'Please provide at least 3 characters',
                    },
                  ]}
                >
                  <Input
                    value={campaign.communityUrl}
                    name="communityUrl"
                    placeholder="https://slack.giveth.com"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item
                  name="reviewerAddress"
                  label="Select a reviewer"
                  rules={[{ required: true }]}
                  extra="This person or smart contract will be reviewing your Campaign to increase trust for Givers."
                  className="custom-form-item"
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
                    value={campaign.reviewerAddress}
                  >
                    {reviewers.map(({ title, value }) => (
                      <Select.Option key={value} value={value}>
                        {title}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    {isNew ? 'Create' : 'Update'} Campaign
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Row>
        </div>
      )}
    </Fragment>
  );
};

EditCampaignV2.propTypes = {
  isNew: PropTypes.bool,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
  displayForeignNetRequiredWarning: PropTypes.func.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

EditCampaignV2.defaultProps = {
  isNew: false,
};

export default EditCampaignV2;
