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
      conversionRates: null,
      currentBalanceValue: null,
    };
  }

  componentDidUpdate() {
    if (this.props.currentUser && !this.state.currency && this.props.entity.donationCounters) {
      // eslint-disable-next-line
      this.setState({ currency: this.props.currentUser.currency });
      this.props
        .convertMultipleRates(
          null,
          this.props.currentUser.currency,
          this.props.entity.donationCounters.map(dc => {
            return {
              value: dc.currentBalance,
              currency: dc.symbol,
            };
          }),
          false,
        )
        .then(result => {
          if (result) {
            this.setState({
              currentBalanceValue: result.total,
              conversionRates: result.rates,
            });
          }
        });
    }
  }

  render() {
    const { entity } = this.props;
    return (
      <WhiteListConsumer>
        {({ state: { nativeCurrencyWhitelist } }) => {
          const precision =
            (nativeCurrencyWhitelist.find(t => t.symbol === this.state.currency) || {}).decimals ||
            2;
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
                        {this.state.currency && this.state.conversionRates && (
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
                          {this.state.currency && this.state.conversionRates && (
                            <td className="td-donations-amount">
                              {roundBigNumber(
                                dc.currentBalance / (this.state.conversionRates[dc.symbol] || 1),
                                precision,
                              ).toFixed()}{' '}
                              {this.state.currency}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {this.state.currency && this.state.currentBalanceValue && (
                      <tfoot>
                        <tr>
                          <td colSpan="4">
                            <span className="font-weight-bold">
                              Total Current Balance Value :{' '}
                              {roundBigNumber(this.state.currentBalanceValue, precision).toFixed()}{' '}
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
          );
        }}
      </WhiteListConsumer>
    );
  }
}

export default getConversionRatesContext(props => <Balances {...props} />);

Balances.propTypes = {
  entity: PropTypes.oneOfType([PropTypes.instanceOf(Campaign), PropTypes.instanceOf(DAC)])
    .isRequired,
  convertMultipleRates: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(User),
};
Balances.defaultProps = {
  currentUser: undefined,
};
