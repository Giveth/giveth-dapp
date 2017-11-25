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
    liquidPledgingAddress: '0x9a3e76a27e18994ebdb1ab813e87f4315d8faa5e',
    dacFactoryAddress: '0x79f7b8faaec2c3f1926164cfdbcf4927afcfc627',
    campaignFactoryAddress: '0x6168e3b4ec2463e556f733c2ebba19fb4f4f87e9',
    milestoneFactoryAddress: '0x8e50fa94479cd6fd54de547e7a8d21af4a12ece3',
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
    liquidPledgingAddress: '0xf062a3d57660a96ace76cd01ddb632482a0a5d3f',
    dacFactoryAddress: '0xb7af828254e8b0b41c83fe55d22d88915da47cbd',
    campaignFactoryAddress: '0x54a192f26bc490e37f0997d63991cf92fc58d097',
    milestoneFactoryAddress: '0x46d6448a52477c13587abe6ebce148b85d5a5fbe',
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
