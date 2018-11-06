import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';

import { getTruncatedText } from '../lib/helpers';
import CardStats from './CardStats';
import { checkBalance } from '../lib/middleware';
import Campaign from '../models/Campaign';

/**
 * Campaign Card visible in the DACs view.
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
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

    checkBalance(this.props.balance)
      .then(() => {
        React.swal({
          title: 'Edit Campaign?',
          text: 'Are you sure you want to edit this Campaign?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            this.props.history.push(`/campaigns/${this.props.campaign.id}/edit`);
          }
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  viewProfile(e) {
    e.stopPropagation();
    this.props.history.push(`/profile/${this.props.campaign.owner.address}`);
  }

  render() {
    const { campaign } = this.props;

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
              currentBalance={campaign.currentBalance}
            />
          </div>
        </div>
      </div>
    );
  }
}

CampaignCard.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  balance: PropTypes.objectOf(utils.BN).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default CampaignCard;
