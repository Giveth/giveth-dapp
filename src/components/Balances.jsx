import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Campaign from 'models/Campaign';
import DAC from 'models/DAC';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';

/**
 * Shows a table of balances for a given entity (dac, campaign)
 */

const Balances = ({ entity }) => {
  const {
    actions: { convertMultipleRates },
  } = useContext(ConversionRateContext);
  const {
    state: { nativeCurrencyWhitelist },
  } = useContext(WhiteListContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [currency, setCurrency] = useState(null);
  const [conversionRates, setConversionRates] = useState(null);
  const [currentBalanceValue, setCurrentBalanceValue] = useState(null);

  useEffect(() => {
    if (currentUser.address && !currency && entity.donationCounters) {
      // eslint-disable-next-line
      setCurrency(currentUser.currency);
      convertMultipleRates(
        null,
        currentUser.currency,
        entity.donationCounters.map(dc => {
          return {
            value: dc.currentBalance,
            currency: dc.symbol,
          };
        }),
        false,
      ).then(result => {
        if (result) {
          setCurrentBalanceValue(result.total);
          setConversionRates(result.rates);
        }
      });
    }
  }, [currentUser, currency, entity]);

  const precision = (nativeCurrencyWhitelist.find(t => t.symbol === currency) || {}).decimals || 2;

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
                {currency && conversionRates && (
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
                  {currency && conversionRates && (
                    <td className="td-donations-amount">
                      {roundBigNumber(
                        dc.currentBalance / (conversionRates[dc.symbol] || 1),
                        precision,
                      ).toFixed()}{' '}
                      {currency}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {currency && currentBalanceValue && (
              <tfoot>
                <tr>
                  <td colSpan="4">
                    <span className="font-weight-bold">
                      Total Current Balance Value :{' '}
                      {roundBigNumber(currentBalanceValue, precision).toFixed()} {currency}
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
};

Balances.propTypes = {
  entity: PropTypes.oneOfType([PropTypes.instanceOf(Campaign), PropTypes.instanceOf(DAC)])
    .isRequired,
};

export default React.memo(Balances);
