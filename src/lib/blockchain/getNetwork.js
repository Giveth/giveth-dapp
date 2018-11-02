import { LiquidPledging } from 'giveth-liquidpledging';
import { LPPCampaignFactory } from 'lpp-campaign';
import { LPPCappedMilestoneFactory } from 'lpp-capped-milestone';
import { GivethBridge, ForeignGivethBridge } from 'giveth-bridge';

import getWeb3 from './getWeb3';
import config from '../../configuration';

let network;

export default async () => {
  if (network) return network;

  const web3 = await getWeb3();

  network = Object.assign({}, config);

  network.liquidPledging = new LiquidPledging(web3, network.liquidPledgingAddress);
  network.lppCampaignFactory = new LPPCampaignFactory(web3, network.lppCampaignFactoryAddress);
  network.lppCappedMilestoneFactory = new LPPCappedMilestoneFactory(
    web3,
    network.lppCappedMilestoneFactoryAddress,
  );
  network.givethBridge = new GivethBridge(web3, network.givethBridgeAddress);
  network.foreignGivethBridge = new ForeignGivethBridge(web3, network.foreignGivethBridgeAddress);

  return network;
};
