import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { getTruncatedText, history } from '../lib/helpers';
import CardStats from './CardStats';
import Campaign from '../models/Campaign';
import config from '../configuration';

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

    return (
      <div
        className="card overview-card"
        id={campaign.id} // eslint-disable-line no-underscore-dangle
        onKeyPress={this.viewCampaign}
        role="button"
        tabIndex="0"
      >
        <a className="card-body" href={this.createCampaignLink()}>
          <div className="card-img" style={{ backgroundImage: `url(${campaign.image})` }} />

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
        </a>
      </div>
    );
  }
}

CampaignCard.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
};

CampaignCard.defaultProps = {};

export default CampaignCard;
