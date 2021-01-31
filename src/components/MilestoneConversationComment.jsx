import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Milestone from 'models/Milestone';
import User from 'models/User';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';
import { actionWithLoggedIn, authenticateIfPossible, checkProfile } from '../lib/middleware';
import ConversationModal from './ConversationModal';

class MilestoneConversationComment extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  checkUser() {
    if (!this.props.currentUser) {
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, false).then(() =>
      checkProfile(this.props.currentUser),
    );
  }

  async writeMessage() {
    const { currentUser } = this.props;

    actionWithLoggedIn(currentUser).then(() =>
      this.conversationModal.current
        .openModal({
          title: 'Comment on Milestone',
          description:
            'You can add comment to milestone status. Your message will be displayed in the updates of milestone status. ',
          textPlaceholder: '',
          required: false,
          cta: 'Add',
          enableAttachProof: false,
        })
        .then(({ message }) => {
          const msg = message.trim();
          if (msg) {
            this.createMessage(msg);
            this.conversationModal.current.setState({ message: '' });
          }
        })
        .catch(_ => {}),
    );
  }

  editMessage() {
    this.checkUser().then(() => {
      if (this.props.currentUser.authenticated) {
        this.writeMessage();
      }
    });
  }

  canUserEdit() {
    const { milestone, currentUser } = this.props;
    return (
      currentUser &&
      currentUser.address &&
      [
        milestone.campaign.ownerAddress,
        milestone.recipientAddress,
        milestone.reviewerAddress,
        milestone.ownerAddress,
      ].includes(currentUser.address)
    );
  }

  createMessage(message) {
    const { milestone } = this.props;
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
  }

  render() {
    const { milestone } = this.props;

    return (
      <div id="milestone-comment">
        {this.canUserEdit() && (
          <Fragment>
            <button
              type="button"
              className="btn btn-success btn-sm w-100"
              onClick={() => this.editMessage()}
            >
              Write Comment
            </button>
            <ConversationModal ref={this.conversationModal} milestone={milestone} />
          </Fragment>
        )}
      </div>
    );
  }
}

MilestoneConversationComment.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User),
};

MilestoneConversationComment.defaultProps = {
  currentUser: undefined,
};

export default MilestoneConversationComment;
