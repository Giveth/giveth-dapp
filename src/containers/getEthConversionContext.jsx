import React from 'react';
import { Consumer as EthConversionConsumer } from '../contextProviders/EthConversionProvider';

/* eslint react/prefer-stateless-function: 0 */
const getEthConversionContext = Component =>
  class GetEthConversionContext extends React.Component {
    render() {
      return (
        <EthConversionConsumer>
          {({ state: { fiatTypes, currentRate }, actions: { getEthConversion } }) => (
            <Component
              getEthConversion={getEthConversion}
              fiatTypes={fiatTypes}
              currentRate={currentRate}
              {...this.props}
            />
          )}
        </EthConversionConsumer>
      );
    }
  };

export default getEthConversionContext;
