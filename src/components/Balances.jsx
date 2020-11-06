import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Campaign from 'models/Campaign';
import DAC from 'models/DAC';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';
import getConversionRatesContext from '../containers/getConversionRatesContext';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';
import User from '../models/User';

/**
 * Shows a table of balances for a given entity (dac, campaign)
 */

class Balances extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currency: null,
      conversionRates: {},
    };
  }

  componentDidUpdate() {
    if (this.props.currentUser && !this.state.currency) {
      // eslint-disable-next-line
      this.setState({ currency: this.props.currentUser.currency });
      this.props.getConversionRates(null, this.props.currentUser.currency).then(currentRate => {
        // eslint-disable-next-line
          this.setState({ conversionRates: currentRate.rates });
      });
    }
  }

  render() {
    const { entity } = this.props;
    return (
      <WhiteListConsumer>
        {({ state: { nativeCurrencyWhitelist } }) => (
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
                      {this.state.currency && this.state.conversionRates[this.state.currency] && (
                        <th className="td-donations-amount">Current Balance value</th>
                      )}
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
                        {this.state.currency && this.state.conversionRates[this.state.currency] && (
                          <td className="td-donations-amount">
                            {roundBigNumber(
                              dc.currentBalance / (this.state.conversionRates[dc.symbol] || 1),
                              (
                                nativeCurrencyWhitelist.find(
                                  t => t.symbol === this.state.currency,
                                ) || {}
                              ).decimals || 2,
                            ).toFixed()}{' '}
                            {this.state.currency}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {this.state.currency && this.state.conversionRates && (
                    <tfoot>
                      <tr>
                        <td colSpan="4">
                          <span className="font-weight-bold">
                            Total Crrent Balance Value :{' '}
                            {roundBigNumber(
                              entity.donationCounters.reduce(
                                (sum, dc) =>
                                  sum +
                                  +dc.currentBalance / (this.state.conversionRates[dc.symbol] || 1),
                                0,
                              ),
                              (
                                nativeCurrencyWhitelist.find(
                                  t => t.symbol === this.state.currency,
                                ) || {}
                              ).decimals || 2,
                            ).toFixed()}{' '}
                            {this.state.currency}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                <div />
              </div>
            )}
          </div>
        )}
      </WhiteListConsumer>
    );
  }
}

export default getConversionRatesContext(props => <Balances {...props} />);

Balances.propTypes = {
  entity: PropTypes.oneOfType([PropTypes.instanceOf(Campaign), PropTypes.instanceOf(DAC)])
    .isRequired,
  getConversionRates: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(User),
};
Balances.defaultProps = {
  currentUser: undefined,
};
