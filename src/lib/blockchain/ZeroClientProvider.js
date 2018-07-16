/* eslint-disable no-underscore-dangle */
import ZeroClientProvider from 'web3-provider-engine/zero';

import GasPriceProvider from './GasPriceProvider';
import CleanserSubProvider from './CleanserSubProvider';
import GanacheGasEstimatorProvider from './GanacheGasEstimator';

const { REACT_APP_ENVIRONMENT = 'localhost' } = process.env;

// extended web3-provider-engine ZeroClientProvider
export default options => {
  const engine = new ZeroClientProvider(options);

  const cleanserSubprovider = new CleanserSubProvider();
  // insert cleanserSubprovider as 1st provider
  cleanserSubprovider.setEngine(engine); // set engine b/c we monkey patch this provider. typically called in engine.start()
  engine._providers.splice(0, 0, cleanserSubprovider);

  // gasPrice
  const gasPriceProvider = new GasPriceProvider();
  gasPriceProvider.setEngine(engine); // set engine b/c we monkey patch this provider. typically called in engine.start()
  engine._providers.splice(7, 0, gasPriceProvider);

  // gasPrice
  if (REACT_APP_ENVIRONMENT === 'localhost') {
    const gasEstimateProvider = new GanacheGasEstimatorProvider();
    gasEstimateProvider.setEngine(engine); // set engine b/c we monkey patch this provider. typically called in engine.start()
    engine._providers.splice(9, 0, gasEstimateProvider);
  }

  return engine;
};
