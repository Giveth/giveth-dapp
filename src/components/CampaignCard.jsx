import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { getTruncatedText } from '../lib/helpers';
import CardStats from './CardStats';
import { redirectAfterWalletUnlock, checkWalletBalance } from '../lib/middleware';
import GivethWallet from '../lib/blockchain/GivethWallet';
import Campaign from '../models/Campaign';

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

    checkWalletBalance(this.props.wallet)
      .then(() => {
        React.swal({
          title: 'Edit Campaign?',
          text: 'Are you sure you want to edit this Campaign?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            redirectAfterWalletUnlock(
              `/campaigns/${this.props.campaign.id}/edit`,
              this.props.wallet,
            );
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
              token={{symbol: 'ETH', decimals: 18}}
            />
          </div>
        </div>
      </div>
    );
  }
}

CampaignCard.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

CampaignCard.defaultProps = {
  wallet: undefined,
};

export default CampaignCard;
