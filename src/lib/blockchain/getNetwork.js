import { LiquidPledging } from 'giveth-liquidpledging-token';
import { LPPDacs } from 'lpp-dacs';
import getWeb3 from './getWeb3';
import config from '../../configuration';

let network;

export default () => {
  if (network) return Promise.resolve(network);

  return getWeb3().then(web3 => {
    network = Object.assign({}, config);
    network.liquidPledging = new LiquidPledging(web3, network.liquidPledgingAddress);
    network.lppDacs = new LPPDacs(web3, network.dacFactoryAddress);

    return network;
  });
};
