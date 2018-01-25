import { LiquidPledging } from 'giveth-liquidpledging-token';
import { LPPDacs } from 'lpp-dacs';
import getWeb3 from './getWeb3';

// The networks look like sparse 2D matrix organised as [networkName][environmentName]
const networks = {
  default: {
    master: {
      title: 'unknown',
      liquidPledgingAddress: '0x0',
      dacsAddress: '0x0',
      campaignFactoryAddress: '0x0',
      cappedMilestoneAddress: '0x0',
      tokenAddress: '0x0',
      etherscan: '',
    },
  },
  testrpc: {
    master: {
      title: 'TestRPC',
      liquidPledgingAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
      dacsAddress: '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb',
      campaignFactoryAddress: '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
      cappedMilestoneAddress: '0xe982E462b094850F12AF94d21D470e21bE9D0E9C',
      tokenAddress: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
      etherscan: 'https://etherscan.io/', // this won't work for. only here so we can see links during development
    },
  },
  main: {
    master: {
      title: 'Main',
      liquidPledgingAddress: '0x3f45D2D5FeB6b4b000d2d3B84442eeDDF54A735a',
      dacsAddress: '0x79bddecb728afda275923998701bac34d277fb19',
      campaignFactoryAddress: '0xB22D042896Cd46D073d3Bf7b487522bBe1eeb5E7',
      cappedMilestoneAddress: '0x61Dc072691041d411bDa8CE5B4090feb45788a8C',
      etherscan: 'https://etherscan.io/',
    },
  },
  morden: {
    master: {
      title: 'Morden',
    },
  },
  ropsten: {
    master: {
      title: 'Ropsten',
      etherscan: 'https://ropsten.etherscan.io/',
    },
  },
  rinkeby: {
    master: {
      title: 'Rinkeby',
      liquidPledgingAddress: '0x5625220088cA4Df67F15f96595546D10e9970B3A',
      dacsAddress: '0xc2Cef51f91dE37739F0a105fEDb058E235BB7354',
      campaignFactoryAddress: '0x2Af51064E9042E62aB09870B4FDe67a1Ba7FEd69',
      cappedMilestoneAddress: '0x19Bd4E0DEdb9E5Ee9762391893d1f661404b561f',
      tokenAddress: '0xb991657107F2F12899938B0985572449400C57d5',
      etherscan: 'https://rinkeby.etherscan.io/',
    },
    develop: {},
    release: {},
    alpha: {},
  },
  kovan: {
    master: {
      title: 'Kovan',
    },
  },
  giveth: {
    master: {
      title: 'Giveth',
      etherscan: 'http://network_explorer.giveth.io/',
    },
  },
};

const replaceWitEnvironmentalVars = network => {
  network.liquidPledgingAddress =
    process.env.REACT_APP_LIQUIDPLEDGING_ADDRESS ||
    network.liquidPledgingAddress;
  network.dacsAddress =
    process.env.REACT_APP_DACS_ADDRESS || network.dacsAddress;
  network.campaignFactoryAddress =
    process.env.REACT_APP_CAMPAIGN_FACTORY_ADDRESS ||
    network.campaignFactoryAddress;
  network.cappedMilestoneAddress =
    process.env.REACT_APP_CAPPED_MILESTONE_ADDRESS ||
    network.cappedMilestoneAddress;
  network.tokenAddress =
    process.env.REACT_APP_TOKEN_ADDRESS || network.tokenAddress;
  network.etherscan = process.env.REACT_APP_BLOCKEXPLORER || network.etherscan;
};

let network;

export default () => {
  if (network) return Promise.resolve(network);

  return getWeb3().then(web3 =>
    web3.eth.net.getId().then(id => {
      let networkName = 'default';
      const environmentName = process.env.REACT_APP_ENVIRONMENT || 'master';
      switch (id) {
        case 1:
          networkName = 'main';
          break;
        case 2:
          networkName = 'morden';
          break;
        case 3:
          networkName = 'ropsten';
          break;
        case 4:
          networkName = 'rinkeby';
          break;
        case 33:
          networkName = 'giveth';
          break;
        case 42:
          networkName = 'kovan';
          break;
        default:
          networkName = 'testrpc';
          break;
      }

      /**
       * Merge the networks in the following order:
       *
       * 1. Default empty networks
       * 2. Master environment/branch for chosen networks
       * 3. Chosen environment/branch for chosen network
       * 4. Network with values defined in the environment variable
       */
      network = Object.assign(
        {},
        networks.default.master,
        networks[networkName].master,
        networks[networkName][environmentName],
      );
      replaceWitEnvironmentalVars(network);

      network.environment = environmentName;
      network.liquidPledging = new LiquidPledging(
        web3,
        network.liquidPledgingAddress,
      );
      network.lppDacs = new LPPDacs(web3, network.dacsAddress);

      console.log(network);
      return network;
    }),
  );
};
