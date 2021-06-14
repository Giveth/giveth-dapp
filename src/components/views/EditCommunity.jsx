import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';

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

import { IPFSService, CommunityService } from '../../services';
import config from '../../configuration';
import Community from '../../models/Community';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import GA from '../../lib/GoogleAnalytics';

const { Title, Text } = Typography;

/**
 * View to create or edit a Community
 *
 * @param isNew    If set, component will load an empty model.
 *                 Otherwise component expects an id param and will load a Community object
 * @param id       URL parameter which is an id of a Community object
 */
const EditCommunity = ({ isNew, match }) => {
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
  const [community, setCommunity] = useState({});

  const communityObject = useRef(
    new Community({
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
      if (!currentUser.isDelegator && projectOwnersWhitelistEnabled) {
        const modal = Modal.error({
          title: 'Permission Denied',
          content: 'You are not allowed to create a Community',
          closable: false,
          centered: true,
          onOk: () => history.replace('/'),
        });

        return () => {
          modal.destroy();
        };
      }

      checkProfile(currentUser).then(() => {
        setCommunity({
          owner: currentUser,
          ownerAddress: currentUser.address,
        });
        setIsLoading(false);
      });
    } else {
      CommunityService.get(match.params.id)
        .then(communityItem => {
          if (isOwner(communityItem.ownerAddress, currentUser)) {
            setCommunity({
              title: communityItem.title,
              description: communityItem.description,
              communityUrl: communityItem.communityUrl,
              reviewerAddress: communityItem.reviewerAddress,
              picture: communityItem.image.match(/\/ipfs\/.*/)[0],
            });
            communityObject.current = communityItem;
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
              'There has been a problem loading the Community. Please refresh the page and try again.',
            );
          }
        });
    }

    return () => {};
  }, [userIsLoading, currentUser, whitelistIsLoading]);

  // TODO: Check if user Changes (in Class components checked in didUpdate)

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCommunity({ ...community, [name]: value });
    setIsBlocking(true);
  };

  const onDescriptionChange = description => {
    handleInputChange({ target: { name: 'description', value: description } });
  };

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  useEffect(() => {
    if (community.image) {
      const picture = community.image.match(/\/ipfs\/.*/)[0];
      setPicture(picture);
    }
  }, [community]);

  const uploadProps = {
    multiple: false,
    accept: 'image/png, image/jpeg',
    customRequest: options => {
      const { onSuccess, onError, file } = options;
      IPFSService.upload(file)
        .then(address => {
          onSuccess(address);
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

      Object.assign(communityObject.current, {
        ...community,
        image: community.picture,
      });

      const afterMined = url => {
        if (url) {
          const msg = (
            <p>
              Your Community has been created!
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
            description: 'Your Community has been updated!',
          });
          history.push(`/communities/${communityObject.current.id}`);
        }
      };

      const afterCreate = (err, url, id) => {
        if (mounted.current) setIsSaving(false);
        if (!err) {
          const msg = (
            <p>
              Your Community is pending....
              <br />
              <a href={url} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>
          );
          notification.info({ description: msg });
          GA.trackEvent({
            category: 'Community',
            action: 'created',
            label: id,
          });
          history.push('/my-communities');
        }
      };

      setIsSaving(true);
      setIsBlocking(false);
      communityObject.current.save(afterCreate, afterMined).finally(() => {
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
                title={isNew ? 'Create New Community' : `Edit Community ${community.title}`}
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
                  title: community.title,
                  description: community.description,
                  reviewerAddress: community.reviewerAddress,
                  communityUrl: community.communityUrl,
                }}
                scrollToFirstError={{
                  block: 'center',
                  behavior: 'smooth',
                }}
              >
                {isNew && (
                  <Fragment>
                    <Title level={3}>Start a Community</Title>
                    <Text>
                      A Community unites Givers and Makers in building a community around their
                      common vision to raise then delegate funds to Campaigns that deliver a
                      positive impact to shared goals.
                    </Text>
                  </Fragment>
                )}
                <Form.Item
                  name="title"
                  label="Name your Community"
                  className="custom-form-item"
                  extra="Describe your Community in 1 sentence."
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
                    value={community.description}
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
                        if (!community.picture) {
                          throw new Error('Picture is required');
                        }
                      },
                    },
                  ]}
                  extra="A picture says more than a thousand words. Select a png or jpg file in a 1:1
                    aspect ratio."
                >
                  <Fragment>
                    {community.picture ? (
                      <div className="picture-upload-preview">
                        <img
                          src={
                            community.picture.startsWith('/ipfs/')
                              ? `${config.ipfsGateway}${community.picture.slice(6)}`
                              : community.picture
                          }
                          alt={community.title}
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
                    value={community.communityUrl}
                    name="communityUrl"
                    placeholder="https://slack.giveth.com"
                    onChange={handleInputChange}
                  />
                </Form.Item>
                <Form.Item>
                  <Button block size="large" type="primary" htmlType="submit" loading={isSaving}>
                    {isNew ? 'Create' : 'Update'} Community
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

EditCommunity.propTypes = {
  isNew: PropTypes.bool,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

EditCommunity.defaultProps = {
  isNew: false,
};

export default EditCommunity;
