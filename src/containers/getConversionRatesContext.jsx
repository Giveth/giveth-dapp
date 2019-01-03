import React from 'react';
import { Consumer as ConversionRateConsumer } from '../contextProviders/ConversionRateProvider';

/* eslint react/prefer-stateless-function: 0 */
const getConversionRatesContext = Component =>
  class GetConversionRateContext extends React.Component {
    render() {
      return (
        <ConversionRateConsumer>
          {({ state: { fiatTypes, currentRate }, actions: { getConversionRates } }) => (
            <Component
              getConversionRates={getConversionRates}
              fiatTypes={fiatTypes}
              currentRate={currentRate}
              {...this.props}
            />
          )}
        </ConversionRateConsumer>
      );
    }
  };

export default getConversionRatesContext;
