import SubProvider from 'web3-provider-engine/subproviders/subprovider';
import { utils } from 'web3';
import { getGasPrice } from './../helpers';

export default class GasPriceProvider extends SubProvider {
  constructor(opts) {
    super();
    this.opts = opts || {};
  }

  /* eslint-disable class-methods-use-this */
  handleRequest(payload, next, end) {
    // eslint-disable-line class-methods-use-this
    if (payload.method !== 'eth_gasPrice') {
      next();
      return;
    }

    getGasPrice()
      .then(gasPrice => {
        end(null, utils.toHex(gasPrice));
      })
      .catch(() => next());
  }
  /* eslint-enable class-methods-use-this */
}
