import React, { Fragment, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Milestone from 'models/Milestone';
import Modal from 'antd/lib/modal/Modal';
import Form, { useForm } from 'antd/lib/form/Form';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';
import { actionWithLoggedIn, authenticateUser, checkProfile } from '../lib/middleware';
// import ConversationModal from './ConversationModal';
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

  const [form] = useForm();

  function checkUser() {
    return authenticateUser(currentUser, false).then(() => checkProfile(currentUser));
  }

  const closeModal = () => {
    setVisible(false);
  };

  function createMessage() {
    form.validateFields().then(_ => {
      closeModal();
      feathersClient
        .service('conversations')
        .create({
          milestoneId: milestone.id,
          message,
          messageContext: 'comment',
        })
        .catch(err => {
          if (err.name === 'NotAuthenticated') {
            console.log('NotAuthenticated');
          } else {
            ErrorPopup('Something went wrong with creating new milestone message ', err);
          }
        });
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
          <button
            type="button"
            className="btn btn-success btn-sm w-100 mt-2"
            onClick={() => showModal()}
          >
            Write Comment
          </button>
          <Modal
            visible={isVisble}
            destroyOnClose
            okText="Add"
            onOk={createMessage}
            onCancel={closeModal}
            title="Comment on Milestone"
          >
            <Form form={form} name="form_in_modal">
              <Editor
                name="message"
                value={message}
                onChange={onMessageChange}
                placeholder="You can add comment to milestone status. Your message will be displayed in the updates of milestone status. "
              />
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
