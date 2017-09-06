import ProviderEngine from 'web3-provider-engine';
import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet';
import DefaultFixture from 'web3-provider-engine/subproviders/default-fixture';
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker';
import CacheSubprovider from 'web3-provider-engine/subproviders/cache';
import FilterSubprovider from 'web3-provider-engine/subproviders/filters';
import InflightCacheSubprovider from 'web3-provider-engine/subproviders/inflight-cache';
import SanitizingSubprovider from 'web3-provider-engine/subproviders/sanitizer';
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch';
import GasPriceProvider from "./GasPriceProvider";

// web3 1.0 only supports async sends
ProviderEngine.prototype.send = ProviderEngine.prototype.sendAsync;

// web3-provider-engine ZeroClientProvider with a ProviderEngine override to work with web3 1.0
export default (opts) => {
  opts = opts || {};

  const engine = new ProviderEngine();

  // static
  const staticSubprovider = new DefaultFixture(opts.static);
  engine.addProvider(staticSubprovider);

  // nonce tracker
  engine.addProvider(new NonceTrackerSubprovider());

  // sanitization
  const sanitizer = new SanitizingSubprovider();
  engine.addProvider(sanitizer);

  // cache layer
  const cacheSubprovider = new CacheSubprovider();
  engine.addProvider(cacheSubprovider);

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

  // data source
  const fetchSubprovider = new FetchSubprovider({
    rpcUrl: opts.rpcUrl || 'https://mainnet.infura.io/',
    originHttpHeaderKey: opts.originHttpHeaderKey,
  });
  engine.addProvider(fetchSubprovider);

  // start polling
  engine.start();

  return engine;
}