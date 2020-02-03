import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Campaign from 'models/Campaign';
import DAC from 'models/DAC';

/**
 * Shows a table of balances for a given entity (dac, campaign)
 */
const Balances = ({ entity }) => (
  <div className="dashboard-table-view">
    {entity.donationCounters && entity.donationCounters.length > 0 && (
      <Fragment>
        <h4>Current balance</h4>
        <div className="table-container">
          <table
            className="table table-responsive table-hover"
            style={{ marginTop: 0, marginBottom: '50px' }}
          >
            <thead>
              <tr>
                <th className="td-donations-amount">Current balance</th>
                <th className="td-donations-number">Number of donations</th>
                <th className="td-donations-amount">Total donated</th>
              </tr>
            </thead>
            <tbody>
              {entity.donationCounters.map(dc => (
                <tr key={dc._id}>
                  <td className="td-donations-amount">
                    {dc.currentBalance && dc.currentBalance !== 'null'
                      ? dc.currentBalance.toNumber()
                      : 0}{' '}
                    {dc.symbol}
                  </td>
                  <td className="td-donations-number">{dc.donationCount || 0}</td>
                  <td className="td-donations-amount">
                    {dc.totalDonated && dc.totalDonated !== 'null' ? dc.totalDonated.toNumber() : 0}{' '}
                    {dc.symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fragment>
    )}
  </div>
);

export default Balances;

Balances.propTypes = {
  entity: PropTypes.oneOfType([PropTypes.instanceOf(Campaign), PropTypes.instanceOf(DAC)])
    .isRequired,
};
