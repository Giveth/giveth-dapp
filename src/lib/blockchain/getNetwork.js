import { LiquidPledging } from 'giveth-liquidpledging';
import { LPPCampaignFactory } from 'lpp-campaign';
import { LPPCappedMilestoneFactory } from 'lpp-capped-milestone';
import { GivethBridge, ForeignGivethBridge } from 'giveth-bridge';

import getWeb3 from './getWeb3';
import config from '../../configuration';
import { feathersClient } from '../feathersClient';

// The minimum ABI to handle any ERC20 Token balance, decimals and allowance approval
const ERC20ABI = [
  // read balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  // read decimals
  // {
  //   constant: true,
  //   inputs: [],
  //   name: 'decimals',
  //   outputs: [{ name: '', type: 'uint8' }],
  //   type: 'function',
  // },
  // set allowance approval
  {
    constant: false,
    inputs: [{ name: '_spender', type: 'address' }, { name: '_amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  // read allowance of a specific address
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
];

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

  network.tokens = {};
  const { tokenWhitelist } = await feathersClient.service('/whitelist').find();
  if (tokenWhitelist) {
    tokenWhitelist.filter(token => web3.utils.isAddress(token.address)).forEach(token => {
      network.tokens[token.address] = new web3.eth.Contract(ERC20ABI, token.address);
    });
  }

  return network;
};
