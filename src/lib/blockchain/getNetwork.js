import { LiquidPledging } from 'liquidpledging';
import getWeb3 from './getWeb3';

const networks = {
  main: {
    title: 'Main',
    liquidPledgingAddress: '0x0',
    dacFactoryAddress: '0x0',
    campaignFactoryAddress: '0x0',
    milestoneFactoryAddress: '0x0',
    etherscan: 'https://etherscan.io/',
  },
  morden: {
    title: 'Morden',
    liquidPledgingAddress: '0x0',
    dacFactoryAddress: '0x0',
    campaignFactoryAddress: '0x0',
    milestoneFactoryAddress: '0x0',
    etherscan: '',
  },
  ropsten: {
    title: 'Ropsten',
    liquidPledgingAddress: '0x18658A1A7cB8b0Be97b155D051769b3651b2943c',
    dacFactoryAddress: '0x0',
    campaignFactoryAddress: '0x0',
    milestoneFactoryAddress: '0x0',
    etherscan: 'https://ropsten.etherscan.io/',
  },
  rinkeby: {
    title: 'Rinkeby',
    liquidPledgingAddress: '0x0',
    dacFactoryAddress: '0x0',
    campaignFactoryAddress: '0x0',
    milestoneFactoryAddress: '0x0',
    etherscan: '',
  },
  kovan: {
    title: 'Kovan',
    liquidPledgingAddress: '0x0',
    dacFactoryAddress: '0x0',
    campaignFactoryAddress: '0x0',
    milestoneFactoryAddress: '0x0',
    etherscan: '',
  },
  giveth: {
    title: 'Giveth',
    liquidPledgingAddress: '0x0',
    dacFactoryAddress: '0x0',
    campaignFactoryAddress: '0x0',
    milestoneFactoryAddress: '0x0',
    etherscan: 'http://network_explorer.giveth.io/',
  },
  default: {
    title: 'TestRPC',
    liquidPledgingAddress: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
    dacFactoryAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    campaignFactoryAddress: '0xC89Ce4735882C9F0f0FE26686c53074E09B0D550',
    milestoneFactoryAddress: '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb',
    etherscan: 'https://etherscan.io/', // this won't work for. only here so we can see links during development
  },
};

let network;

export default () => {
  if (network) return Promise.resolve(network);

  return getWeb3()
    .then(web3 => web3.eth.net.getId()
      .then((id) => {
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
        network.liquidPledging = new LiquidPledging(web3, network.liquidPledgingAddress);
        return network;
      }));
};
