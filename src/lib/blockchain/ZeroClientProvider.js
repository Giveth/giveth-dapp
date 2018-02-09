import ProviderEngine from 'web3-provider-engine';
import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet';
import DefaultFixture from 'web3-provider-engine/subproviders/default-fixture';
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker';
// import CacheSubprovider from 'web3-provider-engine/subproviders/cache';
import FilterSubprovider from 'web3-provider-engine/subproviders/filters';
import InflightCacheSubprovider from 'web3-provider-engine/subproviders/inflight-cache';
import SanitizingSubprovider from 'web3-provider-engine/subproviders/sanitizer';
import GasPriceProvider from './GasPriceProvider';

import WebSocketSubProvider from './WebSocketSubProvider';
import CleanserSubProvider from './CleanserSubProvider';

// web3 1.0 only supports async sends
ProviderEngine.prototype.send = ProviderEngine.prototype.sendAsync;

// web3-provider-engine ZeroClientProvider with a ProviderEngine override to work with web3 1.0
export default options => {
  const opts = options || {};

  // TODO rewrite ProviderEngine to use pubsub instead of EthBlockTracker
  const engine = new ProviderEngine();

  // remove undefined properties from txParams object
  engine.addProvider(new CleanserSubProvider());

  // static
  const staticSubprovider = new DefaultFixture(opts.static);
  engine.addProvider(staticSubprovider);

  // nonce tracker
  engine.addProvider(new NonceTrackerSubprovider());

  // sanitization
  const sanitizer = new SanitizingSubprovider();
  engine.addProvider(sanitizer);

  // TODO the block isn't updated with ws connection, so this cache is never invalidated
  // cache layer
  // const cacheSubprovider = new CacheSubprovider();
  // engine.addProvider(cacheSubprovider);

  // filters
  const filterSubprovider = new FilterSubprovider();
  engine.addProvider(filterSubprovider);

  // inflight cache
  const inflightCache = new InflightCacheSubprovider();
  engine.addProvider(inflightCache);

  // gasPrice
  const gasPriceProvider = new GasPriceProvider();
  engine.addProvider(gasPriceProvider);

  // id mgmt
  const idmgmtSubprovider = new HookedWalletSubprovider({
    // accounts
    getAccounts: opts.getAccounts,
    // transactions
    processTransaction: opts.processTransaction,
    approveTransaction: opts.approveTransaction,
    signTransaction: opts.signTransaction,
    publishTransaction: opts.publishTransaction,
    // messages
    // old eth_sign
    processMessage: opts.processMessage,
    approveMessage: opts.approveMessage,
    signMessage: opts.signMessage,
    // new personal_sign
    processPersonalMessage: opts.processPersonalMessage,
    approvePersonalMessage: opts.approvePersonalMessage,
    signPersonalMessage: opts.signPersonalMessage,
    personalRecoverSigner: opts.personalRecoverSigner,
  });
  engine.addProvider(idmgmtSubprovider);

  // TODO support http connections as well as urls
  // data source
  const fetchSubprovider = new WebSocketSubProvider({
    wsProvider: opts.wsProvider,
  });
  engine.addProvider(fetchSubprovider);

  // start polling
  engine.start();

  engine.on('block', () => engine.stop());

  return engine;
};
