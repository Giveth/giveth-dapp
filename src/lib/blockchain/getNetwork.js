import { LiquidPledging } from 'giveth-liquidpledging';
import { LPPDacFactory } from 'lpp-dac';
import { LPPCampaignFactory } from 'lpp-campaign';
import { LPPCappedMilestoneFactory } from 'lpp-capped-milestone';
import { GivethBridge } from 'giveth-bridge';

import getWeb3 from './getWeb3';
import config from '../../configuration';

let network;

export default () => {
  if (network) return Promise.resolve(network);

  return getWeb3().then(web3 => {
    network = Object.assign({}, config);
    network.liquidPledging = new LiquidPledging(web3, network.liquidPledgingAddress);
    network.lppDacFactory = new LPPDacFactory(web3, network.lppDacFactoryAddress);
    network.lppCampaignFactory = new LPPCampaignFactory(web3, network.lppCampaignFactoryAddress);
    network.lppCappedMilestoneFactory = new LPPCappedMilestoneFactory(
      web3,
      network.lppCappedMilestoneFactoryAddress,
    );
    network.givethBridge = new GivethBridge(web3, network.givethBridgeAddress);

    return network;
  });
};
