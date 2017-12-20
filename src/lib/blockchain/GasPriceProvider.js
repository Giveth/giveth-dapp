import SubProvider from 'web3-provider-engine/subproviders/subprovider';
import { getGasPrice } from './../helpers';

// import { utils } from "web3";

// TODO use http://ethgasstation.info/json/ethgasAPI.json to get gas price
export default class GasPriceProvider extends SubProvider {
  constructor(opts) {
    super();
    this.opts = opts || {};
  }

  /* eslint-disable class-methods-use-this */
  handleRequest(payload, next, _end) {
    // eslint-disable-line class-methods-use-this
    if (payload.method !== 'eth_gasPrice') {
      return next();
    }

    getGasPrice().then(gas => console.log(gas));

    // TODO re-enable this when deployed to mainnet
    return next();

    // getGasPrice().then((gas) =>
    //   end(null, utils.toHex(utils.toWei(gas, 'gwei'))));
  }
  /* eslint-enable class-methods-use-this */
}
