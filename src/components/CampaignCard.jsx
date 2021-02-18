import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { getTruncatedText, history } from '../lib/helpers';
import CardStats from './CardStats';
import Campaign from '../models/Campaign';
import GivethLogo from '../assets/logo.svg';

/**
 * Campaign Card visible in the DACs view.
 */
const CampaignCard = props => {
  const viewCampaign = () => {
    history.push(`/campaigns/${props.campaign.id}`);
  };

  const createCampaignLink = () => {
    return `/campaigns/${props.campaign.id}`;
  };

  const { campaign } = props;
  const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className="card overview-card"
      id={campaign.id} // eslint-disable-line no-underscore-dangle
      onKeyPress={viewCampaign}
      role="button"
      tabIndex="0"
    >
      <Link className="card-body" to={createCampaignLink()}>
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
          />
        </div>
      </Link>
    </div>
  );
};

CampaignCard.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
};

export default React.memo(CampaignCard);
