const {
  REACT_APP_ENVIRONMENT = 'localhost', // optional
  REACT_APP_DECIMALS = 8, // optional
  REACT_APP_FEATHERJS_CONNECTION_URL,
  REACT_APP_ETH_NODE_CONNECTION_URL,
  REACT_APP_LIQUIDPLEDGING_ADDRESS,
  REACT_APP_DAC_FACTORY_ADDRESS,
  REACT_APP_CAMPAIGN_FACTORY_ADDRESS,
  REACT_APP_CAPPED_MILESTONE_FACTORY_ADDRESS,
  REACT_APP_TOKEN_ADDRESSES,
  REACT_APP_BLOCKEXPLORER,
  REACT_APP_BUGS_EMAIL = 'bugs@giveth.io',
} = process.env;

const configurations = {
  localhost: {
    title: 'Ganache',
    liquidPledgingAddress: '0xBeFdf675cb73813952C5A9E4B84ea8B866DBA592',
    lppDacFactoryAddress: '0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66',
    lppCampaignFactoryAddress: '0xe982E462b094850F12AF94d21D470e21bE9D0E9C',
    lppCappedMilestoneFactoryAddress: '0xDb56f2e9369E0D7bD191099125a3f6C370F8ed15',
    givethBridgeAddress: '0x0000000000000000000000000000000000000000',
    tokenAddresses: {},
    etherscan: 'https://etherscan.io/', // this won't work, only here so we can see links during development
    feathersConnection: 'http://localhost:3030',
    nodeConnection: 'ws://localhost:8545',
  },
  develop: {
    title: 'develop',
    liquidPledgingAddress: '0x1ce25E5Db192BB0804aA75D0cA3C7A4f2788Fe10',
    lppDacFactoryAddress: '0x537a9660B517450236aA7ecA654d6e6028374F65',
    lppCampaignFactoryAddress: '0xb9E828CDAC59905FD42C9Bc9A4DC0502194Af8ce',
    lppCappedMilestoneFactoryAddress: '0x286f1D6754D9C5931034B335e662be2700a9704A',
    givethBridgeAddress: '0x0cB06B291c40c76d7bEe7C9f1fAa4D6A4b338C49',
    tokenAddresses: { 'Ropsten ETH': '0x86c194112462cca285a61286114644a293d30157' },
    etherscan: 'https://rinkeby.etherscan.io/',
    feathersConnection: 'https://feathers.develop.giveth.io',
    nodeConnection: 'wss://rinkeby.giveth.io:8546',
  },
  release: {
    title: 'release',
    tokenAddresses: {},
    liquidPledgingAddress: '0x54b38a066267072734b4f30e0088722fd0811286',
    lppDacFactoryAddress: '0xfbdabecd51eabd205c5dc7cc8c90fe153c42b94d',
    lppCampaignFactoryAddress: '0x523c1713fa80bb695ca25f85ee4a06533dceef76',
    lppCappedMilestoneFactoryAddress: '0x9d8a74f03c7765d689171ffb4004670d2bf30a62',
    etherscan: 'https://rinkeby.etherscan.io/',
    feathersConnection: 'https://feathers.release.giveth.io',
    nodeConnection: 'wss://rinkeby.giveth.io:8546',
  },
  mainnet: {
    title: 'mainnet',
    etherscan: 'https://etherscan.io/',
    feathersConnection: 'https://feathers.mainnet.giveth.io',
    nodeConnection: 'wss://mew.giveth.io/ws',
  },
  alpha: {
    title: 'alpha',
    liquidPledgingAddress: '0x5625220088cA4Df67F15f96595546D10e9970B3A',
    lppDacFactoryAddress: '0xc2Cef51f91dE37739F0a105fEDb058E235BB7354',
    lppCampaignFactoryAddress: '0x2Af51064E9042E62aB09870B4FDe67a1Ba7FEd69',
    lppCappedMilestoneFactoryAddress: '0x19Bd4E0DEdb9E5Ee9762391893d1f661404b561f',
    tokenAddresses: {},
    etherscan: 'https://rinkeby.etherscan.io/',
    feathersConnection: 'https://feathers.alpha.giveth.io',
    nodeConnection: 'wss://rinkeby.giveth.io:8546',
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
const config = Object.assign({}, configurations[REACT_APP_ENVIRONMENT]);

// Overwrite the environment values with parameters
config.liquidPledgingAddress = REACT_APP_LIQUIDPLEDGING_ADDRESS || config.liquidPledgingAddress;
config.dacFactoryAddress = REACT_APP_DAC_FACTORY_ADDRESS || config.lppDacFactoryAddress;
config.campaignFactoryAddress =
  REACT_APP_CAMPAIGN_FACTORY_ADDRESS || config.lppCampaignFactoryAddress;
config.cappedMilestoneFactoryAddress =
  REACT_APP_CAPPED_MILESTONE_FACTORY_ADDRESS || config.lppCappedMilestoneFactoryAddress;
config.tokenAddresses = REACT_APP_TOKEN_ADDRESSES
  ? JSON.parse(REACT_APP_TOKEN_ADDRESSES)
  : config.tokenAddresses;
config.etherscan = REACT_APP_BLOCKEXPLORER || config.etherscan;
config.feathersConnection = REACT_APP_FEATHERJS_CONNECTION_URL || config.feathersConnection;
config.nodeConnection = REACT_APP_ETH_NODE_CONNECTION_URL || config.nodeConnection;
config.decimals = REACT_APP_DECIMALS;
config.bugsEmail = REACT_APP_BUGS_EMAIL;
config.sendErrors = ['release', 'alpha', 'mainnet'].includes(REACT_APP_ENVIRONMENT);

export default config;
