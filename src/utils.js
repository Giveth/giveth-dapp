import { utils } from 'web3';
import BigNumber from 'bignumber.js';
import config from './configuration';

export const convertEthHelper = (amount) => {
  const eth = utils.fromWei(amount);
  if (eth.split('.')[1].length > config.decimals) {
    return new BigNumber(eth).toFixed(config.decimals);
  }

  return eth;
}
