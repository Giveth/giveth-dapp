import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import BigNumber from 'bignumber.js';

import { getTruncatedText, getUserAvatar, getUserName, history } from '../lib/helpers';
import { checkBalance } from '../lib/middleware';
import User from '../models/User';
import CardStats from './CardStats';
import GivethLogo from '../assets/logo.svg';

/**
 * A single milestone
 */
class MilestoneCard extends Component {
  constructor(props) {
    super(props);

    this.viewMilestone = this.viewMilestone.bind(this);
    this.editMilestone = this.editMilestone.bind(this);
    this.viewProfile = this.viewProfile.bind(this);
  }

  viewMilestone() {
    history.push(
      `/campaigns/${this.props.milestone.campaign._id}/milestones/${this.props.milestone._id}`,
    );
  }

  viewProfile(e) {
    e.stopPropagation();
    history.push(`/profile/${this.props.milestone.ownerAddress}`);
  }

  editMilestone(e) {
    e.stopPropagation();

    checkBalance(this.props.balance)
      .then(() => {
        history.push(
          `/campaigns/${this.props.milestone.campaign._id}/milestones/${
            this.props.milestone._id
          }/edit`,
        );
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { milestone, currentUser } = this.props;
    const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return (
      <div
        className="card milestone-card overview-card"
        onClick={this.viewMilestone}
        onKeyPress={this.viewMilestone}
        role="button"
        tabIndex="0"
      >
        <div className="card-body">
          <div
            className="card-avatar"
            onClick={this.viewProfile}
            onKeyPress={this.viewProfile}
            role="button"
            tabIndex="0"
          >
            <Avatar size={30} src={getUserAvatar(milestone.owner)} round />
            <span className="owner-name">{getUserName(milestone.owner)}</span>

            {milestone &&
              milestone.canUserEdit(currentUser) && (
                <span className="pull-right">
                  <button
                    type="button"
                    className="btn btn-link btn-edit"
                    onClick={e => this.editMilestone(e)}
                  >
                    <i className="fa fa-edit" />
                  </button>
                </span>
              )}
          </div>

          <div
            className="card-img"
            style={{
              backgroundColor: milestone.image ? 'white' : color,
              backgroundImage: `url(${milestone.image || GivethLogo})`,
            }}
          />

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(milestone.title, 40)}</h4>
            <div className="card-text">{getTruncatedText(milestone.description, 100)}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="milestone"
              peopleCount={milestone.peopleCount}
              totalDonated={milestone.currentBalance}
              maxAmount={milestone.maxAmount}
              milestonesCount={milestone.milestonesCount}
              status={milestone.status}
              token={milestone.token}
            />
          </div>
        </div>
      </div>
    );
  }
}

MilestoneCard.propTypes = {
  milestone: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    campaign: PropTypes.shape().isRequired,
    ownerAddress: PropTypes.string.isRequired,
    owner: PropTypes.shape({
      address: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

MilestoneCard.defaultProps = {
  currentUser: undefined,
};

export default MilestoneCard;
