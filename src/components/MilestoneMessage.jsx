import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Milestone from 'models/Milestone';
import User from 'models/User';
import config from '../configuration';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';
import { authenticateIfPossible, checkProfile } from '../lib/middleware';

class MilestoneMessage extends Component {
  constructor() {
    super();
    this.state = {
      editMode: false,
      content: '',
      charLeft: config.conversationMessageSizeMaxLimit,
      maxChar: config.conversationMessageSizeMaxLimit,
    };
  }

  checkUser() {
    if (!this.props.currentUser) {
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, false).then(() =>
      checkProfile(this.props.currentUser),
    );
  }

  handleChange(e) {
    const { maxChar } = this.state;
    const charCount = e.target.value.length;
    const charLeft = maxChar - charCount;
    this.setState({ content: e.target.value, charLeft });
  }

  editMessage() {
    this.checkUser().then(() => {
      if (this.props.currentUser.authenticated) {
        this.setState({ editMode: true });
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

  createMessage() {
    const { milestone } = this.props;
    feathersClient
      .service('conversations')
      .create({
        milestoneId: milestone.id,
        message: this.state.content,
        messageContext: 'comment',
      })
      .then(() => {
        const { maxChar } = this.state;
        this.setState({ editMode: false, content: '', charLeft: maxChar });
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
    const { content, editMode, maxChar, charLeft } = this.state;

    return (
      <div id="milestone-comment">
        {this.canUserEdit() && !editMode && (
          <button
            type="button"
            className="btn btn-success btn-sm w-100"
            onClick={() => this.editMessage()}
          >
            Write Comment
          </button>
        )}
        {this.canUserEdit() && editMode && (
          <div>
            <textarea
              className="w-100"
              name="comment"
              id="comment-input"
              /* eslint-disable-next-line jsx-a11y/no-autofocus */
              autoFocus
              rows={6}
              cols={30}
              required
              value={content}
              maxLength={maxChar}
              onChange={e => this.handleChange(e)}
            />
            <button
              className="btn btn-link"
              type="button"
              disabled={content.length > maxChar}
              onClick={() => this.createMessage()}
            >
              Add
            </button>
            <button
              type="button"
              className="btn btn-link"
              onClick={() =>
                this.setState({
                  editMode: false,
                  content: '',
                  charLeft: maxChar,
                })
              }
            >
              Cancel
            </button>
            <span className="char-left pull-right text-muted ">{charLeft}</span>
          </div>
        )}
      </div>
    );
  }
}

MilestoneMessage.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User),
};

MilestoneMessage.defaultProps = {
  currentUser: undefined,
};

export default MilestoneMessage;
