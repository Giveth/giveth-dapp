import { Button, Col, Form, Input, notification, PageHeader, Row, Typography, Upload } from 'antd';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Prompt } from 'react-router-dom';
import { DeleteTwoTone } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import Loader from '../Loader';
import Web3ConnectWarning from '../Web3ConnectWarning';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { isOwner, history, getHtmlText } from '../../lib/helpers';
import {
  authenticateUser,
  checkBalance,
  checkForeignNetwork,
  checkProfile,
} from '../../lib/middleware';
import DACservice from '../../services/DACService';
import ErrorHandler from '../../lib/ErrorHandler';
import ErrorPopup from '../ErrorPopup';
import Editor from '../Editor';
import config from '../../configuration';
import { IPFSService } from '../../services';

const { Title, Text } = Typography;

const EditDACV2 = ({
  isNew,
  balance,
  isForeignNetwork,
  displayForeignNetRequiredWarning,
  match,
}) => {
  const {
    state: { currentUser, isLoading: userIsLoading },
  } = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [dac, setDac] = useState({});

  function goBack() {
    history.goBack();
  }

  function checkUser() {
    if (!currentUser) {
      history.push('/');
      return Promise.reject();
    }

    return authenticateUser(currentUser, true)
      .then(() => {
        if (!currentUser) {
          throw new Error('not authorized');
        }
      })
      .then(() => checkProfile(currentUser))
      .then(() => checkBalance(balance));
  }

  useEffect(() => {
    console.log(currentUser, userIsLoading);
    if (userIsLoading) return;
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() => checkUser())
      .then(() => {
        if (!isNew) {
          DACservice.get(match.params.id)
            .then(newDac => {
              // The user is not an owner, hence can not change the DAC
              if (!isOwner(dac.ownerAddress, currentUser)) {
                // TODO: Not really user friendly
                history.goBack();
              } else {
                setDac(newDac);
                setIsLoading(false);
              }
            })
            .catch(err => {
              if (err.status === 404) history.push('/notfound');
              else {
                const message = `Sadly we were unable to load the DAC. Please refresh the page and try again.`;
                ErrorHandler(err, message);
              }
            });
        } else {
          if (!currentUser.isDelegator) {
            history.goBack();
          }
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (err.message !== 'wrongNetwork') {
          ErrorPopup(
            'There has been a problem loading the DAC. Please refresh the page and try again.',
            err,
          );
        }
      });
  }, [userIsLoading]);

  // TODO: Check if user Changes (in Class components checked in didUpdate)

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setDac({ ...dac, [name]: checked });
    } else {
      setDac({ ...dac, [name]: value });
    }
    setIsBlocking(true);
  };

  const onDescriptionChange = description => {
    handleInputChange({ target: { name: 'description', value: description } });
  };

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
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
                title={isNew ? 'Start DAC' : 'Edit DAC'}
                ghost={false}
              />
            </Col>
          </Row>
          <Row>
            <div className="card-form-container">
              <Form className="card-form" requiredMark onFinish={submit}>
                <Title level={3}>Start a Decentralized Altruistic Community (DAC)</Title>
                <Text>
                  A DAC unites Givers and Makers in building a community around their common vision
                  to raise then delegate funds to Campaigns that deliver a positive impact to shared
                  goals.
                </Text>
                <Form.Item
                  name="title"
                  label="Name your Community"
                  className="custom-form-item"
                  extra="Describe your Decentralized Altruistic Community (DAC) in 1 sentence."
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
                    value={dac.title}
                    name="title"
                    placeholder="e.g. Hurricane relief."
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item
                  name="description"
                  label="Explain the cause of your community"
                  className="custom-form-item"
                  extra="Describe the shared vision and goals of your Community and the cause
                  that you are collaborating to solve. Share links, insert media to convey your
                  message and build trust so that people will join your Community and/or donate to the cause."
                  rules={[
                    {
                      required: true,
                      type: 'string',
                    },
                    () => ({
                      validator(_, val) {
                        if (!val || getHtmlText(dac.description).length > 20) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Please provide at least 20 characters'));
                      },
                    }),
                  ]}
                >
                  <Editor
                    name="description"
                    onChange={onDescriptionChange}
                    value={dac.description}
                    placeholder="Describe how you're going to solve your cause..."
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
                    {dac.picture ? (
                      <div className="picture-upload-preview">
                        <img src={`${config.ipfsGateway}${dac.picture.slice(6)}`} alt={dac.title} />
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
                  extra="Where can people join your Community? Paste a link here for your community's website, social or chatroom."
                  rules={[
                    {
                      type: 'string',
                      min: 3,
                      message: 'Please provide at least 3 characters',
                    },
                  ]}
                >
                  <Input
                    value={dac.communityUrl}
                    name="communityUrl"
                    placeholder="https://slack.giveth.com"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    {isNew ? 'Create' : 'Update'} DAC
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

EditDACV2.propTypes = {
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

EditDACV2.defaultProps = {
  isNew: false,
};

export default EditDACV2;
