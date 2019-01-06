import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { feathersClient } from '../lib/feathersClient';
import { getStartOfDayUTC } from '../lib/helpers';
import ErrorPopup from '../components/ErrorPopup';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

BigNumber.config({ DECIMAL_PLACES: 18 });

class ConversionRateProvider extends Component {
  constructor() {
    super();

    const fiatTypes =
      React.whitelist && Array.isArray(React.whitelist.fiatWhitelist)
        ? React.whitelist.fiatWhitelist.map(f => ({ value: f, title: f }))
        : [];

    this.state = {
      conversionRates: [],
      currentRate: undefined,
      fiatTypes,
    };

    this.getConversionRates = this.getConversionRates.bind(this);
  }

  getConversionRates(date, symbol) {
    console.log(`requesting conversion rates for date ${date} and symbol ${symbol}`);

    const dtUTC = getStartOfDayUTC(date); // Should not be necessary as the datepicker should provide UTC, but just to be sure
    const timestamp = Math.round(dtUTC.toDate()) / 1000;

    const { conversionRates } = this.state;
    const cachedConversionRate = conversionRates.find(c => c.timestamp === timestamp);

    if (!cachedConversionRate) {
      // we don't have the conversion rate in cache, fetch from feathers
      return feathersClient
        .service('conversionRates')
        .find({ query: { date: dtUTC, symbol } })
        .then(resp => {
          this.setState({
            conversionRates: conversionRates.concat(resp),
            currentRate: resp,
          });

          return resp;
        })
        .catch(err => {
          ErrorPopup(
            'Sadly we were unable to get the exchange rate. Please try again after refresh.',
            err,
          );
        });
    }
    // we have the conversion rate in cache
    return new Promise(resolve => {
      this.setState({ currentRate: cachedConversionRate }, () => resolve(cachedConversionRate));
    });
  }

  render() {
    const { conversionRates, currentRate, fiatTypes } = this.state;
    const { getConversionRates } = this;

    return (
      <Provider
        value={{
          state: {
            conversionRates,
            currentRate,
            fiatTypes,
          },
          actions: {
            getConversionRates,
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
};

export default ConversionRateProvider;
