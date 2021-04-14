import { feathersClient } from '../lib/feathersClient';

/**
 *
 * @param date : js Date
 * @param symbol example: USD
 * @param to example: ETH
 * @returns * Promise<{
    "timestamp": 1616976000000,
    "rates": {
        "USD": 1,
        "ETH": 0.0005624
    }
  }>
 */
export const getConversionRateBetweenTwoSymbol = ({ date, symbol, to }) => {
  return feathersClient.service('conversionRates').find({ query: { date, symbol, to } });
};

/**
 *
 * @param date : js Date
 * @param symbol : ETH or USD, ..
 * @param currencyArray: ['ETH', 'DAI']
 * @returns * Promise<{
    "timestamp": 1616976000000,
    "rates": {
        "DAI": 1,
        "ETH": 0.0005624
    }
  }>
 */
export const convertMultipleRatesHourly = ({ date, symbol, currencyArray }) => {
  return feathersClient.service('conversionRates').find({
    query: {
      ts: date,
      from: symbol,
      to: currencyArray,
      interval: 'hourly',
    },
  });
};
