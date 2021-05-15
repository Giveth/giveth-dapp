import React, { Fragment, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Milestone from 'models/Milestone';
import Modal from 'antd/lib/modal/Modal';
import { getHtmlText } from 'lib/helpers';
import { Button, Col, Form, Row } from 'antd';
import Lottie from 'lottie-react';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';
import { actionWithLoggedIn, authenticateUser, checkProfile } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';
import Editor from './Editor';
import CommentAnimation from '../assets/pencil.json';

const MilestoneConversationComment = ({ milestone }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const [message, setMessage] = useState('');
  const [isVisble, setVisible] = useState(false);
  const [isCreating, setCreating] = useState(false);

  const [form] = Form.useForm();

  function checkUser() {
    return authenticateUser(currentUser, false).then(() => checkProfile(currentUser));
  }

  const closeModal = () => {
    setVisible(false);
  };

  function createMessage() {
    setCreating(true);
    form
      .validateFields()
      .then(_ => {
        feathersClient
          .service('conversations')
          .create({
            milestoneId: milestone.id,
            message,
            messageContext: 'comment',
          })
          .then(() => {
            setCreating(false);
            closeModal();
          })
          .catch(err => {
            if (err.name === 'NotAuthenticated') {
              console.log('NotAuthenticated');
            } else {
              ErrorPopup('Something went wrong with creating new milestone message ', err);
            }
          });
      })
      .catch(_ => {
        setCreating(false);
      });
  }

  const showModal = () => {
    checkUser().then(() => {
      if (currentUser.authenticated) {
        actionWithLoggedIn(currentUser).then(() => {
          setVisible(true);
        });
      }
    });
  };

  const canUserEdit = () => {
    return (
      currentUser.address &&
      [
        milestone.campaign.ownerAddress,
        milestone.recipientAddress,
        milestone.reviewerAddress,
        milestone.ownerAddress,
      ].includes(currentUser.address)
    );
  };

  const onMessageChange = msg => {
    setMessage(msg);
  };

  const description = (
    <Fragment>
      <p>Use this Comment section to:</p>
      <ul>
        <li>Provide a public record of questions and answers</li>
        <li>Write an update, changes, compliments or concerns</li>
        <li>
          Write other information that helps donors and project participants understand the the
          current status of the Milestone
        </li>
      </ul>
    </Fragment>
  );

  return (
    <div id="milestone-comment">
      {canUserEdit() && (
        <>
          <Button onClick={showModal} type="primary" block className="mt-2">
            Write Comment
          </Button>
          <Modal
            visible={isVisble}
            destroyOnClose
            width={1000}
            footer={null}
            className="antModalComment pb-0"
            centered
            onCancel={closeModal}
          >
            <Row className="justify-content-center">
              <Col className="col m-auto">
                <h3 className="font-weight-bold">Comment on Milestone</h3>
                <div className="mb-4" style={{ fontSize: '18px', minWidth: '300px' }}>
                  {description}
                </div>
              </Col>
              <Col className="text-center">
                <Lottie
                  animationData={CommentAnimation}
                  className="m-auto"
                  loop={false}
                  style={{ width: '250px' }}
                />
              </Col>
            </Row>
            <Form form={form} name="form_in_modal" preserve={false}>
              <Form.Item
                name="message"
                rules={[
                  () => ({
                    validator(_, value) {
                      if (value && getHtmlText(value).length > 10) {
                        return Promise.resolve();
                      }
                      // eslint-disable-next-line prefer-promise-reject-errors
                      return Promise.reject('Please provide at least 10 characters in description');
                    },
                  }),
                ]}
              >
                <Editor name="message" value={message} onChange={onMessageChange} />
              </Form.Item>
            </Form>
            <div className="text-right">
              <Button
                ghost
                onClick={closeModal}
                size="large"
                type="primary"
                loading={isCreating}
                className="m-2"
              >
                Cancel
              </Button>
              <Button
                onClick={createMessage}
                size="large"
                type="primary"
                loading={isCreating}
                className="m-2"
              >
                Submit
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

MilestoneConversationComment.propTypes = {
  milestone: PropTypes.oneOfType(
    [Milestone, BridgedMilestone, LPPCappedMilestone, LPMilestone].map(PropTypes.instanceOf),
  ).isRequired,
};

export default MilestoneConversationComment;
