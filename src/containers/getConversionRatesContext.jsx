import React from 'react';
import { Consumer as ConversionRateConsumer } from '../contextProviders/ConversionRateProvider';

const getConversionRatesContext = Component => props => (
  <ConversionRateConsumer>
    {({
      state: { fiatTypes, currentRate, isLoading },
      actions: { getConversionRates, convertMultipleRates },
    }) => (
      <Component
        getConversionRates={getConversionRates}
        convertMultipleRates={convertMultipleRates}
        fiatTypes={fiatTypes}
        currentRate={currentRate}
        conversionRateLoading={isLoading}
        {...props}
      />
    )}
  </ConversionRateConsumer>
);

export default getConversionRatesContext;
