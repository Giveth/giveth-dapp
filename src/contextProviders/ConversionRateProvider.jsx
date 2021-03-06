// eslint-disable-next-line max-classes-per-file
import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { feathersClient } from '../lib/feathersClient';
import { getStartOfDayUTC } from '../lib/helpers';
import ErrorPopup from '../components/ErrorPopup';
import ErrorHandler from '../lib/ErrorHandler';

const Context = createContext();
const { Consumer, Provider } = Context;
export { Consumer, Context };

BigNumber.config({ DECIMAL_PLACES: 18 });

// FIXME: The storage should store values with integers as keys rather than ISO date strings. That is using Date.getTime() method
/**
 * Storage of cached conversion rates. It stores the rates in objects per token as follows:
 *
 * BTC: {
 *   2019-01-07T00:00:00.000Z: {BTC: 1, CZK: 89919.47, EUR: 3527.11, THB: 127648.26, BRL: 15081.51, …}
 *   2019-01-14T00:00:00.000Z: {BTC: 1, MXN: 69718.29, GBP: 2827.18, BRL: 13916.09, AUD: 4975.01, …}
 *   2019-01-15T00:00:00.000Z: {BTC: 1, GBP: 2856.89, THB: 117610.94, AUD: 5062.48, MXN: 69428.72, …}
 *   2019-01-21T00:00:00.000Z: {BTC: 1, AUD: 4954.68, BRL: 13597.04, CAD: 5152.09, CZK: 79920.63, …}
 * }
 * GTT:
 *   2019-01-09T00:00:00.000Z: {GTT: 1}
 *   2019-01-15T00:00:00.000Z: {GTT: 1}
 *   2019-01-16T00:00:00.000Z: {GTT: 1}
 *   2019-01-22T00:00:00.000Z: {GTT: 1}
 * }
 */
class ConversionStorage {
  /**
   * Get rates for given symbol and date
   * @param {string} symbol Token symbol
   * @param {string} date   ISO date string
   * @param {string} to   Destination token (optional)
   *
   * @return {object|boolean} If found return the pair {timestamp, rates}, else return false
   */
  get(symbol, date, to = null) {
    // the user wants to know if there is a conversion rate for tuple of <symbol,date,to> and return true if exists
    if (this[symbol] && this[symbol][date] && this[symbol][date][to]) {
      return { timestamp: date, rates: this[symbol][date] };
    }
    return false;
  }

  /**
   * Add new rate
   *
   * @param {string} symbol Token symbol
   * @param {string} date   ISO date string
   * @param {object} rates  Rates for given date
   *
   *  @return {object} Pair {timestamp, rates} that have been added
   */
  add(symbol, date, rates) {
    if (!this[symbol]) this[symbol] = {};
    this[symbol][date] = { ...this[symbol][date], ...rates };

    return { timestamp: date, rates: this[symbol][date] };
  }
}

class ConversionRateProvider extends Component {
  constructor(props) {
    super(props);

    this.rates = new ConversionStorage();

    this.state = {
      isLoading: false,
      currentRate: {
        rates: {},
        timestamp: getStartOfDayUTC()
          .subtract(1, 'd')
          .toISOString(),
      },
    };

    this.getConversionRates = this.getConversionRates.bind(this);
  }

  getConversionRates(date, symbol, to = null) {
    const dtUTC = getStartOfDayUTC(date); // Should not be necessary as the datepicker should provide UTC, but just to be sure

    const rate = this.rates.get(symbol, dtUTC.toISOString(), to);
    // We have the rate cached
    if (rate) {
      return new Promise(resolve => {
        this.setState({ currentRate: rate }, () => resolve(rate));
      });
    }

    this.setState({ isLoading: true });

    // We don't have the conversion rate in cache, fetch from feathers
    return feathersClient
      .service('conversionRates')
      .find({ query: { date: dtUTC.valueOf(), symbol, to } })
      .then(resp => {
        const rt = this.rates.add(symbol, dtUTC.toISOString(), resp.rates);

        this.setState({ currentRate: rt, isLoading: false });

        return rt;
      })
      .catch(err => {
        const message = `Sadly we were unable to get the exchange rate. Please try again after refresh.`;
        ErrorHandler(err, message);

        this.setState({ isLoading: false });
      });
  }

  // rateArray: [{value: 123, currency: 'ETH'}]
  // eslint-disable-next-line
  convertMultipleRates(date, symbol, rateArray, showPopupOnError = false) {
    return feathersClient
      .service('conversionRates')
      .find({
        query: {
          ts: date,
          from: symbol,
          to: rateArray.map(r => r.currency),
          interval: 'hourly',
        },
      })
      .then(resp => {
        const { rates } = resp;
        const total = rateArray.reduce(
          (sum, item) => sum + item.value / (+rates[item.currency] || 1),
          0,
        );
        return { total, rates };
      })
      .catch(err => {
        if (showPopupOnError) {
          ErrorPopup(
            'Sadly we were unable to get the exchange rate! Please try again after refresh.',
            err,
          );
        } else {
          React.toast.error(
            'Sadly we were unable to get the exchange rate! Please refresh the page later.',
          );
        }
      });
  }

  render() {
    const { currentRate, isLoading } = this.state;
    const { fiatWhitelist } = this.props;
    const { getConversionRates } = this;

    return (
      <Provider
        value={{
          state: {
            currentRate,
            isLoading,
            fiatTypes: fiatWhitelist.map(f => ({ value: f, title: f })),
          },
          actions: {
            getConversionRates,
            convertMultipleRates: this.convertMultipleRates,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

ConversionRateProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  fiatWhitelist: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ConversionRateProvider;
