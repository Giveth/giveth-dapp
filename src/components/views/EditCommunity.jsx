import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';

import { Button, Col, Form, Input, Modal, PageHeader, Row, Typography } from 'antd';

import Loader from '../Loader';
import { getHtmlText, history, isOwner, txNotification } from '../../lib/helpers';
import { authenticateUser, checkProfile } from '../../lib/middleware';
import ErrorHandler from '../../lib/ErrorHandler';

import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../../contextProviders/UserProvider';

import Web3ConnectWarning from '../Web3ConnectWarning';
import Editor from '../Editor';

import { CommunityService } from '../../services';
import Community from '../../models/Community';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { sendAnalyticsTracking } from '../../lib/SegmentAnalytics';
import UploadPicture from '../UploadPicture';

const { Title, Text } = Typography;

/**
 * View to create or edit a Community
 *
 * @param isNew    If set, component will load an empty model.
 *                 Otherwise component expects an id param and will load a Community object
 * @param match
 */
const EditCommunity = ({ isNew, match }) => {
  const {
    state: { currentUser, isLoading: userIsLoading },
  } = useContext(UserContext);

  const {
    state: { projectOwnersWhitelistEnabled, isLoading: whitelistIsLoading },
  } = useContext(WhiteListContext);

  const {
    state: { isForeignNetwork, web3 },
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

  const goBack = () => {
    history.goBack();
  };

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
              id: match.params.id,
              slug: communityItem.slug,
              reviewerAddress: communityItem.reviewerAddress,
              ownerAddress: communityItem.ownerAddress,
              picture: communityItem.image.match(/\/ipfs\/.*/)[0],
            });
            communityObject.current = communityItem;
            setIsLoading(false);
          } else {
            ErrorHandler({}, 'You are not allowed to edit this Community.');
            goBack();
          }
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

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false, web3);

    if (authenticated) {
      if (!isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      Object.assign(communityObject.current, {
        ...community,
        image: community.picture,
      });

      const afterMined = txUrl => {
        txNotification(`Your Community has been ${isNew ? 'created' : 'updated'}!`, txUrl);
        if (mounted.current) setIsSaving(false);
      };

      const afterCreate = ({ err, txUrl, response }) => {
        if (mounted.current) setIsSaving(false);
        if (!err) {
          txNotification(
            `Your Community is ${isNew ? 'pending....' : 'is being updated'}`,
            txUrl,
            true,
          );
          const analyticsData = {
            slug: response.slug,
            title: community.title,
            userAddress: currentUser.address,
            ownerAddress: community.ownerAddress,
            communityId: response._id,
            txUrl,
          };
          if (isNew) {
            sendAnalyticsTracking('Community Created', {
              category: 'Community',
              action: 'edited',
              ...analyticsData,
            });
          } else {
            sendAnalyticsTracking('Community Edited', {
              category: 'Community',
              action: 'edited',
              ...analyticsData,
            });
          }
          history.push(`/community/${response.slug}`);
        }
      };

      setIsSaving(true);
      setIsBlocking(false);
      communityObject.current.save(afterCreate, afterMined, web3).finally(() => {
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
        <Fragment>
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

                <UploadPicture
                  setPicture={setPicture}
                  picture={community.picture || ''}
                  imgAlt={community.title || ''}
                  label="Add a picture"
                  required
                />

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
        </Fragment>
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
