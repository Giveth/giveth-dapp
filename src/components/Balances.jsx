import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';

import Campaign from 'models/Campaign';
import DAC from 'models/DAC';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import TotalGasPaid from './views/TotalGasPaid';

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
          <table className="table table-hover text-left mt-0">
            <thead>
              <tr>
                <th className="td-donations-amount">Current balance</th>
                {currency && conversionRates && (
                  <th className="td-donations-amount">Current balance value</th>
                )}
                <th className="td-donations-number">Number of donations</th>
                <th className="td-donations-amount text-right">Total donated</th>
              </tr>
            </thead>
            <tbody>
              {entity.donationCounters.map(dc => (
                <tr key={dc._id} className="text-left">
                  <td className="td-donations-amount">
                    {convertEthHelper(dc.currentBalance, dc.decimals)} {dc.symbol}
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
                  <td className="td-donations-number">{dc.donationCount || 0}</td>
                  <td className="td-donations-amount text-right">
                    {convertEthHelper(dc.totalDonated, dc.decimals)} {dc.symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Row className="p-2 mb-4" justify="space-between" style={{ fontSize: '0.8rem' }}>
            {entity instanceof Campaign && (
              <Col>
                <TotalGasPaid gasPaidUsdValue={entity.gasPaidUsdValue} entity="CAMPAIGN:" />
              </Col>
            )}
            {currency && currentBalanceValue && (
              <Col className="my-auto py-3">
                <span className="font-weight-bold">
                  Total Current Balance Value :{' '}
                  {roundBigNumber(currentBalanceValue, precision).toFixed()} {currency}
                </span>
              </Col>
            )}
          </Row>
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
