import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Milestone from 'models/Milestone';
import Modal from 'antd/lib/modal/Modal';
import { getHtmlText } from 'lib/helpers';
import { Button, Form } from 'antd';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';
import { actionWithLoggedIn, authenticateUser, checkProfile } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';
import Editor from './Editor';

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
            okText="Add"
            okButtonProps={{ loading: isCreating }}
            onOk={createMessage}
            onCancel={closeModal}
            title="Comment on Milestone"
          >
            <p>
              You can add comment to milestone status. Your message will be displayed in the updates
              of milestone status
            </p>
            <Form form={form} name="form_in_modal">
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
