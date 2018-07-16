import SubProvider from 'web3-provider-engine/subproviders/subprovider';
import { utils } from 'web3';

const { REACT_APP_ENVIRONMENT = 'localhost' } = process.env;
const MAX_GAS = utils.toBN(6700000);
const { toBN, toHex } = utils;

// ganache sucks at estimating gas, so we add a fat margin to what is returned
// https://github.com/trufflesuite/ganache-core/pull/75
export default class GanacheGasEstimatorProvider extends SubProvider {
  /* eslint-disable class-methods-use-this */
  handleRequest(payload, next, end) {
    // eslint-disable-line class-methods-use-this
    if (REACT_APP_ENVIRONMENT !== 'localhost' || payload.method !== 'eth_estimateGas') {
      next();
      return;
    }

    // hacky
    this.engine._providers[this.engine._providers.length - 1].handleRequest(
      payload,
      next,
      (err, result) => {
        if (err) {
          // handle simple value transfer case
          if (err.message === 'no contract code at given address') {
            return end(null, '0xcf08');
          }
          return end(err);
        }

        const estimate = toBN(result).add(toBN(1000000));
        const newResult = estimate.gt(MAX_GAS) ? MAX_GAS : estimate;
        return end(null, toHex(newResult));
      },
    );
  }
}
