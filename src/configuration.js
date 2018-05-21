const {
  REACT_APP_ENVIRONMENT = 'develop', // optional
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
    lppDacFactoryAddress: '0x26b4afb60d6c903165150c6f0aa14f8016be4aec',
    lppCampaignFactoryAddress: '0x0290FB167208Af455bB137780163b7B7a9a10C16',
    lppCappedMilestoneFactoryAddress: '0x6eD79Aa1c71FD7BdBC515EfdA3Bd4e26394435cC',
    givethBridgeAddress: '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab',
    foreignGivethBridgeAddress: '0xD86C8F0327494034F60e25074420BcCF560D5610',
    tokenAddresses: { 'Home ETH': '0xc43d5F3D92Fa39089Fd5E3b67841bFB8d62457F3' },
    etherscan: 'https://etherscan.io/', // this won't work, only here so we can see links during development
    foreignEtherscan: 'https://ropsten.etherscan.io/', // this won't work, only here so we can see links during development
    feathersConnection: 'http://localhost:3030',
    foreignNodeConnection: 'ws://localhost:8546',
    homeNodeConnection: 'http://localhost:8545',
  },
  develop: {
    title: 'develop',
    liquidPledgingAddress: '0x06A6743268EbFb2649301f3Ce651C44AbafCC4f5',
    lppDacFactoryAddress: '0xCD573630fd57d14Ff0f1A653f62Fbe1C8d92a00B',
    lppCampaignFactoryAddress: '0x2BCaFb4772Ca5525c7b83cEBdd5C48b99183f9f6',
    lppCappedMilestoneFactoryAddress: '0xb5456EFF4aaA44C60dEb1743caD127Ce1D101466',
    givethBridgeAddress: '0x8588EE5E97e06bA863FDB2EBc5b523246D459638',
    foreignGivethBridgeAddress: '0xE91Bf42cb524afa9f01AB56E1804eD162C643d05',
    tokenAddresses: { 'Ropsten ETH': '0x86c635C10Adf6F982222006B9cc984E1Ccd9c1fC' },
    etherscan: 'https://rinkeby.etherscan.io/',
    foreignEtherscan: 'https://ropsten.etherscan.io/',
    feathersConnection: 'https://feathers.develop.giveth.io',
    foreignNodeConnection: 'wss://rinkeby.giveth.io/ws',
    homeNodeConnection: 'https://ropsten.infura.io/Id3GoVvLrsO08ZNjxiKz',
  },
  release: {
    title: 'release',
    tokenAddresses: {},
    liquidPledgingAddress: '0x54b38a066267072734b4f30e0088722fd0811286',
    lppDacFactoryAddress: '0xfbdabecd51eabd205c5dc7cc8c90fe153c42b94d',
    lppCampaignFactoryAddress: '0x523c1713fa80bb695ca25f85ee4a06533dceef76',
    lppCappedMilestoneFactoryAddress: '0x9d8a74f03c7765d689171ffb4004670d2bf30a62',
    etherscan: 'https://rinkeby.etherscan.io/',
    foreignEtherscan: 'https://ropsten.etherscan.io/',
    feathersConnection: 'https://feathers.release.giveth.io',
    foreignNodeConnection: 'wss://rinkeby.giveth.io:8546',
    homeNodeConnection: 'https://ropsten.infura.io/Id3GoVvLrsO08ZNjxiKz',
  },
  mainnet: {
    title: 'mainnet',
    etherscan: 'https://etherscan.io/',
    feathersConnection: 'https://feathers.mainnet.giveth.io',
    foreignNodeConnection: 'wss://mew.giveth.io/ws',
    homeNodeConnection: 'https://ropsten.infura.io/Id3GoVvLrsO08ZNjxiKz',
  },
  alpha: {
    title: 'alpha',
    liquidPledgingAddress: '0x5625220088cA4Df67F15f96595546D10e9970B3A',
    lppDacFactoryAddress: '0xc2Cef51f91dE37739F0a105fEDb058E235BB7354',
    lppCampaignFactoryAddress: '0x2Af51064E9042E62aB09870B4FDe67a1Ba7FEd69',
    lppCappedMilestoneFactoryAddress: '0x19Bd4E0DEdb9E5Ee9762391893d1f661404b561f',
    tokenAddresses: {},
    etherscan: 'https://rinkeby.etherscan.io/',
    foreignEtherscan: 'https://ropsten.etherscan.io/',
    feathersConnection: 'https://feathers.alpha.giveth.io',
    foreignNodeConnection: 'wss://rinkeby.giveth.io:8546',
    homeNodeConnection: 'https://ropsten.infura.io/Id3GoVvLrsO08ZNjxiKz',
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
config.foreignNodeConnection = REACT_APP_ETH_NODE_CONNECTION_URL || config.foreignNodeConnection;
config.decimals = REACT_APP_DECIMALS;
config.bugsEmail = REACT_APP_BUGS_EMAIL;
config.sendErrors = ['develop', 'release', 'alpha', 'mainnet'].includes(REACT_APP_ENVIRONMENT);

export default config;
