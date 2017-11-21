import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import { getTruncatedText, isOwner, getUserAvatar, getUserName } from './../lib/helpers';
import { redirectAfterWalletUnlock, checkWalletBalance } from './../lib/middleware';
import currentUserModel from '../models/currentUserModel';
import CardStats from './CardStats';
import GivethWallet from '../lib/blockchain/GivethWallet';

// TODO Remove the eslint exception and fix feathers to provide id's without underscore
/* eslint no-underscore-dangle: 0 */
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
    this.props.history.push(`/campaigns/${this.props.milestone.campaignId}/milestones/${this.props.milestone._id}`);
  }

  viewProfile(e) {
    e.stopPropagation();
    this.props.history.push(`/profile/${this.props.milestone.owner.address}`);
  }

  editMilestone(e) {
    e.stopPropagation();

    checkWalletBalance(this.props.wallet, this.props.history).then(() => {
      React.swal({
        title: 'Edit Milestone?',
        text: 'Are you sure you want to edit this milestone?',
        icon: 'warning',
        dangerMode: true,
        buttons: ['Cancel', 'Yes, edit'],
      }).then((isConfirmed) => {
        if (isConfirmed) {
          redirectAfterWalletUnlock(`/campaigns/${this.props.milestone.campaignId}/milestones/${this.props.milestone._id}/edit`, this.props.wallet, this.props.history);
        }
      });
    });
  }

  render() {
    const { milestone, currentUser } = this.props;

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

            { isOwner(milestone.owner.address, currentUser) &&
              <span className="pull-right">
                <button className="btn btn-link btn-edit" onClick={e => this.editMilestone(e)}>
                  <i className="fa fa-edit" />
                </button>
              </span>
            }
          </div>

          <div className="card-img" style={{ backgroundImage: `url(${milestone.image})` }} />

          <div className="card-content">
            <small>deadline: {milestone.completionDeadline}</small>
            <h4 className="card-title">{getTruncatedText(milestone.title, 30)}</h4>
            <div className="card-text">{milestone.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="milestone"
              donationCount={milestone.donationCount}
              totalDonated={milestone.totalDonated}
              maxAmount={milestone.maxAmount}
              milestonesCount={milestone.milestonesCount}
              status={milestone.status}
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
    campaignId: PropTypes.string.isRequired,
    owner: PropTypes.shape({
      address: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  currentUser: currentUserModel,
  wallet: PropTypes.instanceOf(GivethWallet),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

MilestoneCard.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default MilestoneCard;
