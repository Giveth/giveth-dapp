import React from 'react';
import { Consumer as ConversionRateConsumer } from '../contextProviders/ConversionRateProvider';

const getConversionRatesContext = Component => props => (
  <ConversionRateConsumer>
    {({ state: { fiatTypes, currentRate }, actions: { getConversionRates } }) => (
      <Component
        getConversionRates={getConversionRates}
        fiatTypes={fiatTypes}
        currentRate={currentRate}
        {...props}
      />
    )}
  </ConversionRateConsumer>
);

export default getConversionRatesContext;
