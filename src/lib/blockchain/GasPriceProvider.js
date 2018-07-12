import SubProvider from 'web3-provider-engine/subproviders/subprovider';
import { utils } from 'web3';
import { getGasPrice } from '../helpers';

export default class GasPriceProvider extends SubProvider {
  constructor(opts) {
    super();
    this.opts = opts || {};
    this.netLookups = [];
  }

  /* eslint-disable class-methods-use-this */
  handleRequest(payload, next, end) {
    // eslint-disable-line class-methods-use-this
    if (payload.method !== 'eth_gasPrice' || this.netLookups.includes(payload.id)) {
      next();
      return;
    }

    const id = new Date().getTime();
    this.netLookups.push(id);

    this.engine.sendAsync(
      { jsonrpc: '2.0', id, method: 'net_version', params: [] },
      (err, response) => {
        const i = this.netLookups.findIndex(lId => lId === response.id);
        if (i > -1) this.netLookups.splice(i, 1);

        // only call getGasPrice for mainnet b/c it uses ethgasstation api
        if (response.result === '1') {
          getGasPrice()
            .then(gasPrice => {
              end(null, utils.toHex(gasPrice));
            })
            .catch(() => next());
        } else {
          next();
        }
      },
    );
  }
  /* eslint-enable class-methods-use-this */
}
