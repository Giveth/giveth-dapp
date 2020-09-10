import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import User from 'models/User';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';
import { authenticateIfPossible, checkProfile } from '../lib/middleware';

/* eslint no-underscore-dangle: 0 */
class MilestoneMessage extends Component {
  constructor() {
    super();

    this.state = {
      editMode: false,
      content: '',
    };
  }

  checkUser() {
    if (!this.props.currentUser) {
      // history.push('/');
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, false).then(() =>
      checkProfile(this.props.currentUser),
    );
  }

  handleChange(e) {
    this.setState({ content: e.target.value });
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
      .then(() => this.setState({ editMode: false }))
      .catch(err => {
        if (err.name === 'NotAuthenticated') {
          console.log('NotAuthenticated');
        } else {
          ErrorPopup('Something went wrong with creating new milestone message ', err);
        }
      });
  }

  render() {
    const { content, editMode } = this.state;

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
              className="w-100 "
              name=""
              id=""
              cols="30"
              rows="6"
              value={content}
              onChange={e => this.handleChange(e)}
            />
            <button type="button" className="btn btn-link" onClick={() => this.createMessage()}>
              Add
            </button>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => this.setState({ editMode: false })}
            >
              Cancel
            </button>
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
