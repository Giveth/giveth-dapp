/* eslint-disable no-underscore-dangle */
import ZeroClientProvider from 'web3-provider-engine/zero';

import GasPriceProvider from './GasPriceProvider';
import CleanserSubProvider from './CleanserSubProvider';

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

  return engine;
};
