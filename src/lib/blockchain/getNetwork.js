import { LiquidPledging } from 'giveth-liquidpledging';
import { LPPDacs } from 'lpp-dacs';
import getWeb3 from './getWeb3';

const networks = {
  main: {
    title: 'Main',
    liquidPledgingAddress: '0x3f45D2D5FeB6b4b000d2d3B84442eeDDF54A735a',
    dacsAddress: '0x869ed845F8D4B436fFE778ADC0E9ab253E53f0F2',
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
    liquidPledgingAddress: '0x9a3e76a27e18994ebdb1ab813e87f4315d8faa5e',
    dacsAddress: '0x79f7b8faaec2c3f1926164cfdbcf4927afcfc627',
    campaignFactoryAddress: '0x6168e3b4ec2463e556f733c2ebba19fb4f4f87e9',
    cappedMilestoneAddress: '0x0',
    etherscan: 'https://ropsten.etherscan.io/',
  },
  rinkeby: {
    title: 'Rinkeby',
    liquidPledgingAddress: '0x1B8F84E443668C81FeE5BEc266bc098e3c7fBC00',
    dacsAddress: '0xdE97f5541522619c152b55289091A7114defEE58',
    campaignFactoryAddress: '0xBcDE1c9bAdcd99D87a2c20E5B7D0C5E190479C53',
    cappedMilestoneAddress: '0x137802c8F48294331654108dd64d8acD48b3321d',
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
    liquidPledgingAddress: '0xc2E1c6cf5D18247d63618dABf58E14F058D02c7C',
    dacsAddress: '0x1AaF7E3a6fCF450C41E647cD4D1103BE8daC5c23',
    campaignFactoryAddress: '0xb9fFf4674EA94950be86f499EB85Ce95Aa27FebF',
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
        network.lppDacs = new LPPDacs(web3, network.dacsAddress);
        return network;
      }));
};
