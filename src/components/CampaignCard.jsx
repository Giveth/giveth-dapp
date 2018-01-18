import React, { Component } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';

import { isOwner, getTruncatedText, getUserName, getUserAvatar } from './../lib/helpers';
import CardStats from './CardStats';
import User from './../models/User';
import { redirectAfterWalletUnlock, checkWalletBalance } from './../lib/middleware';
import BaseWallet from '../lib/blockchain/BaseWallet';
import Campaign from './../models/Campaign';

/**
 * Campaign Card visible in the DACs view.
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class CampaignCard extends Component {
  constructor(props) {
    super(props);

    this.viewProfile = this.viewProfile.bind(this);
    this.viewCampaign = this.viewCampaign.bind(this);
    this.editCampaign = this.editCampaign.bind(this);
  }
  viewCampaign() {
    this.props.history.push(`/campaigns/${this.props.campaign.id}`);
  }

  editCampaign(e) {
    e.stopPropagation();

    checkWalletBalance(this.props.wallet, this.props.history).then(() => {
      React.swal({
        title: 'Edit Campaign?',
        text: 'Are you sure you want to edit this Campaign?',
        icon: 'warning',
        dangerMode: true,
        buttons: ['Cancel', 'Yes, edit'],
      }).then((isConfirmed) => {
        if (isConfirmed) {
          redirectAfterWalletUnlock(`/campaigns/${this.props.campaign.id}/edit`, this.props.wallet, this.props.history);
        }
      });
    });
  }

  viewProfile(e) {
    e.stopPropagation();
    this.props.history.push(`/profile/${this.props.campaign.owner.address}`);
  }


  render() {
    const { campaign, currentUser } = this.props;

    return (
      <div
        className="card overview-card"
        id={campaign.id} // eslint-disable-line no-underscore-dangle
        onClick={this.viewCampaign}
        onKeyPress={this.viewCampaign}
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

            <Avatar size={30} src={getUserAvatar(campaign.owner)} round />
            <span className="owner-name">{getUserName(campaign.owner)}</span>

            { isOwner(campaign.owner.address, currentUser) &&
              <span className="pull-right">
                <button
                  className="btn btn-link btn-edit"
                  onClick={this.editCampaign}
                >
                  <i className="fa fa-edit" />
                </button>
              </span>
            }
          </div>

          <div className="card-img" style={{ backgroundImage: `url(${campaign.image})` }} />

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(campaign.title, 30)}</h4>
            <div className="card-text">{campaign.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="campaign"
              peopleCount={campaign.peopleCount}
              totalDonated={campaign.totalDonated}
              milestonesCount={campaign.milestonesCount}
            />
          </div>

        </div>
      </div>
    );
  }
}

CampaignCard.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(BaseWallet),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

CampaignCard.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default CampaignCard;
