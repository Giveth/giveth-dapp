import SubProvider from 'web3-provider-engine/subproviders/subprovider';
import { utils } from "web3";

//TODO use http://ethgasstation.info/json/ethgasAPI.json to get gas price
export default class GasPriceProvider extends SubProvider {
  constructor(opts) {
    super();
    this.opts = opts || {};
  }

  handleRequest(payload, next, end) {
    if (payload.method !== 'eth_gasPrice') return next();

    end(null, utils.toHex(utils.toWei(4, 'gwei')));
  }
}