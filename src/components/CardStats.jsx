import React from 'react';
import PropTypes from 'prop-types';
import { convertEthHelper } from '../lib/helpers';

/**
 * Shows the statistics on DACs, Campaigns and milestonesCount
 *
 * TODO: Check the properties that are passed, sometimes they are number, sometimes strings...
 */
const CardStats = ({ peopleCount, maxAmount, totalDonated, type, status, token }) => (
  <div className="row card-stats">
    {['dac', 'campaign'].includes(type) && (
      <div className="col-6 text-left">
        <p>Giver(s)</p>
        <span>
          <i className="fa fa-male" />
          {peopleCount}
        </span>
      </div>
    )}

    {type === 'milestone' && (
      <div className="col-3 text-left">
        <p>Giver(s)</p>
        <span>
          <i className="fa fa-male" />
          {peopleCount}
        </span>
      </div>
    )}

    {['dac', 'campaign'].includes(type) && (
      <div className="col-5 text-center card-center">
        <span>
          <p>Donations</p>
          <p>{totalDonated}</p>
        </span>
      </div>
    )}

    {type === 'milestone' && (
      <div className="col-5 text-center card-center">
        {maxAmount && (
          <span>
            <p>Requested</p>
            <p>
              {convertEthHelper(maxAmount)} {token.symbol}
            </p>
          </span>
        )}
      </div>
    )}

    {type === 'milestone' && (
      <div className="col-4 text-right">
        <p>status</p>
        <span>
          <i className="fa fa-check-circle" />
          {status}
        </span>
      </div>
    )}
  </div>
);

CardStats.propTypes = {
  type: PropTypes.string.isRequired,
  peopleCount: PropTypes.number.isRequired,
  status: PropTypes.string,
  maxAmount: PropTypes.string,
  totalDonated: PropTypes.number,
  token: PropTypes.shape({}),
};

CardStats.defaultProps = {
  status: 'In Progress',
  maxAmount: undefined,
  totalDonated: undefined,
  token: undefined,
};

export default CardStats;
