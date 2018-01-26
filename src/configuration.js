const {
  REACT_APP_ENVIRONMENT = 'localhost', // optional
  REACT_APP_FEATHERJS_CONNECTION_URL,
  REACT_APP_ETH_NODE_CONNECTION_URL,
  REACT_APP_LIQUIDPLEDGING_ADDRESS,
  REACT_APP_DACS_ADDRESS,
  REACT_APP_CAMPAIGN_FACTORY_ADDRESS,
  REACT_APP_CAPPED_MILESTONE_ADDRESS,
  REACT_APP_TOKEN_ADDRESS,
  REACT_APP_BLOCKEXPLORER,
} = process.env;

const configurations = {
  default: {
    title: 'unknown',
    liquidPledgingAddress: '0x0',
    dacsAddress: '0x0',
    campaignFactoryAddress: '0x0',
    cappedMilestoneAddress: '0x0',
    tokenAddress: '0x0',
    etherscan: '',
    feathersConnection: 'http://localhost:3030',
    nodeConnection: 'ws://localhost:8546',
  },
  localhost: {
    title: 'TestRPC',
    liquidPledgingAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    dacsAddress: '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb',
    campaignFactoryAddress: '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
    cappedMilestoneAddress: '0xe982E462b094850F12AF94d21D470e21bE9D0E9C',
    tokenAddress: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
    etherscan: 'https://etherscan.io/', // this won't work, only here so we can see links during development
    feathersConnection: 'http://localhost:3030',
    nodeConnection: 'ws://localhost:8546',
  },
  develop: {
    title: 'develop',
    tokenAddress: '0x7c1a3c53a30407b1047e5eb71d104e8159d0b135',
    liquidPledgingAddress: '0xE6D8BC43685911AfA2e7E47A88d364bbE9692E19',
    dacsAddress: '0x0B60e1786D694909d6340E9538d67B79df00dAEf',
    campaignFactoryAddress: '0xa6E585A9481aF710026993818c0B4c5c32ae2F36',
    cappedMilestoneAddress: '0xbfb48a8817de49f259a71d2Aa07fC1c95EC24265',
    etherscan: 'https://rinkeby.etherscan.io/',
    feathersConnection: 'https://feathers.develop.giveth.io/',
    nodeConnection: 'wss://rinkeby.giveth.io:8546/',
  },
  release: {
    title: 'release',
    tokenAddress: '0xe4231c2906acad65e68a932ea4b4bc6c38340f4f',
    liquidPledgingAddress: '0x54b38a066267072734b4f30e0088722fd0811286',
    dacsAddress: '0xfbdabecd51eabd205c5dc7cc8c90fe153c42b94d',
    campaignFactoryAddress: '0x523c1713fa80bb695ca25f85ee4a06533dceef76',
    cappedMilestoneAddress: '0x9d8a74f03c7765d689171ffb4004670d2bf30a62',
    etherscan: 'https://rinkeby.etherscan.io/',
    feathersConnection: 'https://feathers.release.giveth.io/',
    nodeConnection: 'wss://mew.giveth.io/ws/',
  },
  mainnet: {
    title: 'release',
    liquidPledgingAddress: '0x3f45D2D5FeB6b4b000d2d3B84442eeDDF54A735a',
    dacsAddress: '0x79bddecb728afda275923998701bac34d277fb19',
    campaignFactoryAddress: '0xB22D042896Cd46D073d3Bf7b487522bBe1eeb5E7',
    cappedMilestoneAddress: '0x61Dc072691041d411bDa8CE5B4090feb45788a8C',
    etherscan: 'https://etherscan.io/',
    feathersConnection: 'https://feathers.mainnet.giveth.io/',
    nodeConnection: 'wss://rinkeby.giveth.io:8546/',
  },
  alpha: {
    title: 'alpha',
    liquidPledgingAddress: '0x5625220088cA4Df67F15f96595546D10e9970B3A',
    dacsAddress: '0xc2Cef51f91dE37739F0a105fEDb058E235BB7354',
    campaignFactoryAddress: '0x2Af51064E9042E62aB09870B4FDe67a1Ba7FEd69',
    cappedMilestoneAddress: '0x19Bd4E0DEdb9E5Ee9762391893d1f661404b561f',
    tokenAddress: '0xb991657107F2F12899938B0985572449400C57d5',
    etherscan: 'https://rinkeby.etherscan.io/',
    feathersConnection: 'https://feathers.mainnet.giveth.io',
    nodeConnection: 'wss://rinkeby.giveth.io:8546/',
  },
};

// Unknown environment
if (configurations[REACT_APP_ENVIRONMENT] === undefined)
  throw new Error(
    `There is no configuration object for environment: ${REACT_APP_ENVIRONMENT}. Expected REACT_APP_ENVIRONMENT to be empty or one of: ${Object.keys(
      configurations,
    )}`,
  );

// Create config object based on environment setup
const config = Object.assign(
  {},
  configurations.default,
  configurations[REACT_APP_ENVIRONMENT],
);

// Overwrite the environment values with parameters
config.liquidPledgingAddress =
  REACT_APP_LIQUIDPLEDGING_ADDRESS || config.liquidPledgingAddress;
config.dacsAddress = REACT_APP_DACS_ADDRESS || config.dacsAddress;
config.campaignFactoryAddress =
  REACT_APP_CAMPAIGN_FACTORY_ADDRESS || config.campaignFactoryAddress;
config.cappedMilestoneAddress =
  REACT_APP_CAPPED_MILESTONE_ADDRESS || config.cappedMilestoneAddress;
config.tokenAddress = REACT_APP_TOKEN_ADDRESS || config.tokenAddress;
config.etherscan = REACT_APP_BLOCKEXPLORER || config.etherscan;
config.feathersConnection =
  REACT_APP_FEATHERJS_CONNECTION_URL || config.feathersConnection;
config.nodeConnection =
  REACT_APP_ETH_NODE_CONNECTION_URL || config.nodeConnection;

export default config;
