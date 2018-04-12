import React from 'react';
import { utils } from 'web3';
import PropTypes from 'prop-types';
import { convertEthHelper } from '../utils';
import BigNumber from 'bignumber.js';

/**
 * Shows the statistics on DACs, Campaigns and milestonesCount
 *
 * TODO: Check the properties that are passed, sometimes they are number, sometimes strings...
 */
const CardStats = ({
  totalDonated,
  peopleCount,
  maxAmount,
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

    <div className={"col-4 text-center" + (maxAmount ? 'card-center' : '')}>
      {maxAmount && (
        <span>
          Requested amount: {convertEthHelper(maxAmount)} ETH
        </span>
      )}

      {!maxAmount && <span>{totalDonated && utils.fromWei(totalDonated)} ETH</span>}
      {!maxAmount && <p>Donated</p>}
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
  totalDonated: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  campaignsCount: PropTypes.number,
  milestonesCount: PropTypes.number,
  status: PropTypes.string,
  maxAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CardStats.defaultProps = {
  status: 'In Progress',
  milestonesCount: 0,
  maxAmount: undefined,
  campaignsCount: 0,
};

export default CardStats;
