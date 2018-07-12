import React from 'react';
import PropTypes from 'prop-types';
import { convertEthHelper } from '../lib/helpers';

/**
 * Shows the statistics on DACs, Campaigns and milestonesCount
 *
 * TODO: Check the properties that are passed, sometimes they are number, sometimes strings...
 */
const CardStats = ({
  peopleCount,
  maxAmount,
  totalDonated,
  campaignsCount,
  milestonesCount,
  type,
  status,
}) => (
  <div className="row card-stats">
    <div className="col-4 text-left">
      <span>
        <i className="fa fa-male" />
        {peopleCount}
      </span>
      <p>Giver(s)</p>
    </div>

    <div className="col-4 text-center card-center">
      {maxAmount && <p>Amount requested:{convertEthHelper(maxAmount)} ETH</p>}

      {totalDonated && <p>Donated:{convertEthHelper(totalDonated)} ETH</p>}
    </div>

    <div className="col-4 text-right">
      {type === 'dac' && (
        <div>
          <span>
            <i className="fa fa-flag" />
            {campaignsCount}
          </span>
          <p>campaign(s)</p>
        </div>
      )}

      {type === 'campaign' && (
        <div>
          <span>
            <i className="fa fa-check-circle" />
            {milestonesCount}
          </span>
          <p>Milestone(s)</p>
        </div>
      )}

      {type === 'milestone' && (
        <div>
          <span>
            <i className="fa fa-check-circle" />
            {status}
          </span>
          <p>status</p>
        </div>
      )}
    </div>
  </div>
);

CardStats.propTypes = {
  type: PropTypes.string.isRequired,
  peopleCount: PropTypes.number.isRequired,
  campaignsCount: PropTypes.number,
  milestonesCount: PropTypes.number,
  status: PropTypes.string,
  maxAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  totalDonated: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CardStats.defaultProps = {
  status: 'In Progress',
  milestonesCount: 0,
  maxAmount: undefined,
  totalDonated: undefined,
  campaignsCount: 0,
};

export default CardStats;
