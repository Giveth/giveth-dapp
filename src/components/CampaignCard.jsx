import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { getTruncatedText, history } from '../lib/helpers';
import CardStats from './CardStats';
import Campaign from '../models/Campaign';
import config from '../configuration';
import GivethLogo from '../assets/logo.svg';

/**
 * Campaign Card visible in the DACs view.
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 */
class CampaignCard extends Component {
  constructor(props) {
    super(props);

    this.viewCampaign = this.viewCampaign.bind(this);
    this.createCampaignLink = this.createCampaignLink.bind(this);
  }

  viewCampaign() {
    history.push(`/campaigns/${this.props.campaign.id}`);
  }

  createCampaignLink() {
    return `/campaigns/${this.props.campaign.id}`;
  }

  render() {
    const { campaign } = this.props;
    const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return (
      <div
        className="card overview-card"
        id={campaign.id} // eslint-disable-line no-underscore-dangle
        onKeyPress={this.viewCampaign}
        role="button"
        tabIndex="0"
      >
        <Link className="card-body" to={this.createCampaignLink()}>
          <div
            className="card-img"
            style={{
              backgroundColor: campaign.image ? 'white' : color,
              backgroundImage: `url(${campaign.image || GivethLogo})`,
            }}
          />

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(campaign.title, 40)}</h4>
            <div className="card-text">{campaign.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="campaign"
              peopleCount={campaign.peopleCount}
              totalDonated={campaign.totalDonationCount}
              currentBalance={campaign.currentBalance}
              token={{ symbol: config.nativeTokenName, decimals: 18 }}
            />
          </div>
        </Link>
      </div>
    );
  }
}

CampaignCard.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
};

CampaignCard.defaultProps = {};

export default CampaignCard;
