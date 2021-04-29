import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import 'react-input-token/lib/style.css';

import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  notification,
  PageHeader,
  Row,
  Typography,
  Upload,
} from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import Loader from '../Loader';
import { getHtmlText, history, isOwner } from '../../lib/helpers';
import { authenticateUser, checkProfile } from '../../lib/middleware';
import ErrorHandler from '../../lib/ErrorHandler';

import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../../contextProviders/UserProvider';

import Web3ConnectWarning from '../Web3ConnectWarning';
import Editor from '../Editor';

import { IPFSService, DACService } from '../../services';
import config from '../../configuration';
import DAC from '../../models/DAC';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import GA from '../../lib/GoogleAnalytics';

const { Title, Text } = Typography;

/**
 * View to create or edit a DAC
 *
 * @param isNew    If set, component will load an empty model.
 *                 Otherwise component expects an id param and will load a DAC object
 * @param id       URL parameter which is an id of a DAC object
 */
const EditDAC = ({ isNew, match }) => {
  const {
    state: { currentUser, isLoading: userIsLoading },
  } = useContext(UserContext);

  const {
    state: { projectOwnersWhitelistEnabled, isLoading: whitelistIsLoading },
  } = useContext(WhiteListContext);

  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dac, setDac] = useState({});

  const dacObject = useRef(
    new DAC({
      owner: currentUser,
      ownerAddress: currentUser.address,
    }),
  );
  const mounted = useRef();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (userIsLoading || whitelistIsLoading || !currentUser.address) return () => {};

    if (isNew) {
      if (!currentUser.isProjectOwner && projectOwnersWhitelistEnabled) {
        const modal = Modal.error({
          title: 'Permission Denied',
          content: 'You are not allowed to create a DAC',
          closable: false,
          centered: true,
          onOk: () => history.replace('/'),
        });

        return () => {
          modal.destroy();
        };
      }

      checkProfile(currentUser).then(() => {
        setDac({
          owner: currentUser,
          ownerAddress: currentUser.address,
        });
        setIsLoading(false);
      });
    } else {
      DACService.get(match.params.id)
        .then(community => {
          if (isOwner(community.ownerAddress, currentUser)) {
            setDac({
              title: community.title,
              description: community.description,
              communityUrl: community.communityUrl,
              reviewerAddress: community.reviewerAddress,
              picture: community.image.match(/\/ipfs\/.*/)[0],
            });
            dacObject.current = community;
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
              'There has been a problem loading the DAC. Please refresh the page and try again.',
            );
          }
        });
    }

    return () => {};
  }, [userIsLoading, currentUser]);

  // TODO: Check if user Changes (in Class components checked in didUpdate)

  const handleInputChange = event => {
    const { name, value } = event.target;
    setDac({ ...dac, [name]: value });
    setIsBlocking(true);
  };

  const onDescriptionChange = description => {
    handleInputChange({ target: { name: 'description', value: description } });
  };

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  useEffect(() => {
    if (dac.image) {
      const picture = dac.image.match(/\/ipfs\/.*/)[0];
      setPicture(picture);
    }
  }, [dac]);

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

  const removePicture = () => {
    setPicture('');
  };

  const goBack = () => {
    history.goBack();
  };

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);

    if (authenticated) {
      if (!isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      Object.assign(dacObject.current, {
        ...dac,
        image: dac.picture,
      });

      const afterMined = url => {
        if (url) {
          const msg = (
            <p>
              Your DAC has been created!
              <br />
              <a href={url} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>
          );
          notification.success({ message: '', description: msg });
        } else {
          if (mounted.current) setIsSaving(false);
          notification.success({
            message: '',
            description: 'Your DAC has been updated!',
          });
          history.push(`/dacs/${dacObject.current.id}`);
        }
      };

      const afterCreate = (err, url, id) => {
        if (mounted.current) setIsSaving(false);
        if (!err) {
          const msg = (
            <p>
              Your DAC is pending....
              <br />
              <a href={url} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>
          );
          notification.info({ description: msg });
          GA.trackEvent({
            category: 'DAC',
            action: 'created',
            label: id,
          });
          history.push('/my-dacs');
        }
      };

      setIsSaving(true);
      setIsBlocking(false);
      dacObject.current.save(afterCreate, afterMined).finally(() => {
        setIsSaving(false);
      });
    }
  };

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
                title={isNew ? 'Create New DAC' : `Edit DAC ${dac.title}`}
                ghost={false}
              />
            </Col>
          </Row>
          <Row>
            <div className="card-form-container">
              <Form
                className="card-form"
                requiredMark
                onFinish={submit}
                initialValues={{
                  title: dac.title,
                  description: dac.description,
                  reviewerAddress: dac.reviewerAddress,
                  communityUrl: dac.communityUrl,
                }}
                scrollToFirstError={{
                  block: 'center',
                  behavior: 'smooth',
                }}
              >
                {isNew && (
                  <Fragment>
                    <Title level={3}>Start a Decentralized Altruistic Community (DAC)</Title>
                    <Text>
                      A DAC unites Givers and Makers in building a community around their common
                      vision to raise then delegate funds to Campaigns that deliver a positive
                      impact to shared goals.
                    </Text>
                  </Fragment>
                )}
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
                    name="title"
                    placeholder="e.g. Hurricane relief"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item
                  name="description"
                  label="Explain the cause of your community"
                  className="custom-form-item"
                  extra="Describe the shared vision and goals of your Community and the cause that you are collaborating to solve. Share links, insert media to convey your message and build trust so that people will join your Community and/or donate to the cause."
                  rules={[
                    {
                      required: true,
                      type: 'string',
                      message: 'Description is required',
                    },
                    {
                      validator: async (_, val) => {
                        if (val && getHtmlText(val).length <= 10) {
                          throw new Error(
                            'Please provide at least 10 characters and do not edit the template keywords.',
                          );
                        }
                      },
                    },
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
                  name="Picture"
                  label="Add a picture"
                  className="custom-form-item"
                  rules={[
                    {
                      validator: async () => {
                        if (!dac.picture) {
                          throw new Error('Picture is required');
                        }
                      },
                    },
                  ]}
                  extra="A picture says more than a thousand words. Select a png or jpg file in a 1:1
                    aspect ratio."
                >
                  <Fragment>
                    {dac.picture ? (
                      <div className="picture-upload-preview">
                        <img
                          src={
                            dac.picture.startsWith('/ipfs/')
                              ? `${config.ipfsGateway}${dac.picture.slice(6)}`
                              : dac.picture
                          }
                          alt={dac.title}
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
                    value={dac.communityUrl}
                    name="communityUrl"
                    placeholder="https://slack.giveth.com"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item>
                  <Button block size="large" type="primary" htmlType="submit" loading={isSaving}>
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

EditDAC.propTypes = {
  isNew: PropTypes.bool,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

EditDAC.defaultProps = {
  isNew: false,
};

export default EditDAC;
