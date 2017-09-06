import { utils } from "web3";

//TODO use http://ethgasstation.info/json/ethgasAPI.json to get gas price
export default class GasPriceProvider {
  constructor(opts) {
    this.opts = opts || {};
  }

  handleRequest(payload, next, end) {
    if (payload.method !== 'eth_gasPrice') return next();

    end(null, utils.toWei(4, 'gwei'));
  }
}