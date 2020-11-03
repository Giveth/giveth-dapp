import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Campaign from 'models/Campaign';
import DAC from 'models/DAC';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';
import getConversionRatesContext from '../containers/getConversionRatesContext';

/**
 * Shows a table of balances for a given entity (dac, campaign)
 */

class Balances extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currency: 'USD',
      conversionRates: {},
    };
    props.getConversionRates(null, this.state.currency).then(currentRate => {
      this.setState({ conversionRates: currentRate.rates });
    });
  }

  render() {
    const { entity } = this.props;
    const { currency, conversionRates } = this.state;
    return (
      <div className="dashboard-table-view">
        {entity.donationCounters && entity.donationCounters.length > 0 && (
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
                  <th className="td-donations-amount">Total donated in {currency}</th>
                </tr>
              </thead>
              <tbody>
                {entity.donationCounters.map(dc => (
                  <tr key={dc._id}>
                    <td className="td-donations-amount">
                      {convertEthHelper(dc.currentBalance, dc.decimals)} {dc.symbol}
                    </td>
                    <td className="td-donations-number">{dc.donationCount || 0}</td>
                    <td className="td-donations-amount">
                      {convertEthHelper(dc.totalDonated, dc.decimals)} {dc.symbol}
                    </td>
                    <td className="td-donations-amount">
                      $
                      {roundBigNumber(
                        dc.totalDonated / (conversionRates[dc.symbol] || 1),
                        2,
                      ).toFixed()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4">
                    <span className="font-weight-bold">
                      Crrent Balance Value :{' '}
                      {roundBigNumber(
                        entity.donationCounters.reduce((sum, dc) => sum + +dc.currentBalance, 0),
                        2,
                      ).toFixed()}{' '}
                      {currency}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
            <div />
          </div>
        )}
      </div>
    );
  }
}

export default getConversionRatesContext(props => <Balances {...props} />);

Balances.propTypes = {
  entity: PropTypes.oneOfType([PropTypes.instanceOf(Campaign), PropTypes.instanceOf(DAC)])
    .isRequired,
  getConversionRates: PropTypes.func.isRequired,
};
