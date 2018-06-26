import React, { Component } from 'react';
import { Consumer as EthConversionConsumer } from '../contextProviders/EthConversionProvider';

/* eslint react/prefer-stateless-function: 0 */
const getEthConversionContext = C =>
  class GetEthConversionContext extends Component {
    render() {
      return (
        <EthConversionConsumer>
          {({ state: { fiatTypes, currentRate }, actions: { getEthConversion } }) => (
            <C
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
