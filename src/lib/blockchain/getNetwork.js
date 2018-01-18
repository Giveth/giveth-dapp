import { LiquidPledging } from 'giveth-liquidpledging';
import { LPPDacs } from 'lpp-dacs';
import getWeb3 from './getWeb3';

const networks = {
  main: {
    title: 'Main',
    liquidPledgingAddress: '0x3f45D2D5FeB6b4b000d2d3B84442eeDDF54A735a',
    dacsAddress: '0x79bddecb728afda275923998701bac34d277fb19',
    campaignFactoryAddress: '0xB22D042896Cd46D073d3Bf7b487522bBe1eeb5E7',
    cappedMilestoneAddress: '0x61Dc072691041d411bDa8CE5B4090feb45788a8C',
    etherscan: 'https://etherscan.io/',
  },
  morden: {
    title: 'Morden',
    liquidPledgingAddress: '0x0',
    dacsAddress: '0x0',
    campaignFactoryAddress: '0x0',
    cappedMilestoneAddress: '0x0',
    etherscan: '',
  },
  ropsten: {
    title: 'Ropsten',
    liquidPledgingAddress: '0x0',
    dacsAddress: '0x0',
    campaignFactoryAddress: '0x0',
    cappedMilestoneAddress: '0x0',
    etherscan: 'https://ropsten.etherscan.io/',
  },
  rinkeby: {
    title: 'Rinkeby',
    liquidPledgingAddress: '0x40de47F30Bac30dDB151948591030fe543Cdd43D',
    dacsAddress: '0x55D8284F19A70955b9785a2a06d410C789474B5b',
    campaignFactoryAddress: '0x2D3cd1A70978F208Edbf3E9a2722912A1d3753d2',
    cappedMilestoneAddress: '0xfd39a5C81452C061e28B7aeD4E05a7bB9105c462',
    etherscan: 'https://rinkeby.etherscan.io/',
  },
  kovan: {
    title: 'Kovan',
    liquidPledgingAddress: '0x0',
    dacsAddress: '0x0',
    campaignFactoryAddress: '0x0',
    cappedMilestoneAddress: '0x0',
    etherscan: '',
  },
  giveth: {
    title: 'Giveth',
    liquidPledgingAddress: '0x0',
    dacsAddress: '0x0',
    campaignFactoryAddress: '0x0',
    cappedMilestoneAddress: '0x0',
    etherscan: 'http://network_explorer.giveth.io/',
  },
  default: {
    title: 'TestRPC',
    liquidPledgingAddress: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
    dacsAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    campaignFactoryAddress: '0xC89Ce4735882C9F0f0FE26686c53074E09B0D550',
    cappedMilestoneAddress: '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb',
    etherscan: 'https://etherscan.io/', // this won't work for. only here so we can see links during development
  },
};

let network;

export default () => {
  if (network) return Promise.resolve(network);

  return getWeb3().then(web3 =>
    web3.eth.net.getId().then(id => {
      switch (id) {
        case 1:
          network = Object.assign({}, networks.main);
          break;
        case 2:
          network = Object.assign({}, networks.morden);
          break;
        case 3:
          network = Object.assign({}, networks.ropsten);
          break;
        case 4:
          network = Object.assign({}, networks.rinkeby);
          break;
        case 33:
          network = Object.assign({}, networks.giveth);
          break;
        case 42:
          network = Object.assign({}, networks.kovan);
          break;
        default:
          network = Object.assign({}, networks.default);
          break;
      }
      network.liquidPledging = new LiquidPledging(
        web3,
        network.liquidPledgingAddress,
      );
      network.lppDacs = new LPPDacs(web3, network.dacsAddress);
      return network;
    }),
  );
};
