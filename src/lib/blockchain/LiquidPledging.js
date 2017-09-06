import liquidpledging from "liquidpledging";

const LiquidPledging = liquidpledging.LiquidPledging(false);

export default class {
  constructor(web3, address) {
    this.liquidPledging = new LiquidPledging(web3, address);
  }
}
