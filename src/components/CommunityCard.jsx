import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { getTruncatedText, history } from '../lib/helpers';
import CardStats from './CardStats';
import Community from '../models/Community';
import GivethLogo from '../assets/logo.svg';

/**
 * Community Card visible in the Communities view.
 */
const CommunityCard = props => {
  const viewCommunity = () => {
    history.push(`/community/${props.community.slug}`);
  };

  const createCommunityLink = () => {
    return `/community/${props.community.slug}`;
  };

  const { community } = props;
  const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className="card overview-card"
      id={community.id}
      onKeyPress={viewCommunity}
      role="button"
      tabIndex="0"
    >
      <Link className="card-body" to={createCommunityLink()}>
        <div
          className="card-img"
          style={{
            backgroundColor: community.image ? 'white' : color,
            backgroundImage: `url(${community.image || GivethLogo})`,
          }}
        />

        <div className="card-content">
          <h4 className="card-title">{getTruncatedText(community.title, 30)}</h4>
          <div className="card-text">{community.summary}</div>
        </div>

        <div className="card-footer">
          <CardStats
            type="community"
            peopleCount={community.peopleCount}
            totalDonated={community.totalDonationCount}
            currentBalance={community.currentBalance}
          />
        </div>
      </Link>
    </div>
  );
};

CommunityCard.propTypes = {
  community: PropTypes.instanceOf(Community).isRequired,
};

export default React.memo(CommunityCard);
