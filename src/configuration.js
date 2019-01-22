const {
  REACT_APP_ENVIRONMENT = 'localhost', // optional
  REACT_APP_DECIMALS = 8, // optional
  REACT_APP_FEATHERJS_CONNECTION_URL,
  REACT_APP_NODE_CONNECTION_URL,
  REACT_APP_LIQUIDPLEDGING_ADDRESS,
  REACT_APP_CAMPAIGN_FACTORY_ADDRESS,
  REACT_APP_CAPPED_MILESTONE_FACTORY_ADDRESS,
  REACT_APP_TOKEN_ADDRESSES,
  REACT_APP_BLOCKEXPLORER,
  REACT_APP_BUGS_EMAIL = 'bugs@giveth.io',
  REACT_APP_DEFAULT_GASPRICE = 10,
  REACT_APP_NETWORK_NAME,
  REACT_APP_NATIVE_TOKEN_NAME,
} = process.env;

const configurations = {
  localhost: {
    title: 'Ganache',
    liquidPledgingAddress: '0xBeFdf675cb73813952C5A9E4B84ea8B866DBA592',
    lppCampaignFactoryAddress: '0x9b1f7F645351AF3631a656421eD2e40f2802E6c0',
    lppCappedMilestoneFactoryAddress: '0x630589690929E9cdEFDeF0734717a9eF3Ec7Fcfe',
    givethBridgeAddress: '0x8fed3F9126e7051DeA6c530920cb0BAE5ffa17a8',
    foreignGivethBridgeAddress: '0x8fed3F9126e7051DeA6c530920cb0BAE5ffa17a8',
    tokenAddresses: {
      'Home Ganache ETH': '0x5a42ca500aB159c51312B764bb25C135026e7a31',
      'MiniMe Test Token': '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab',
    },
    etherscan: 'https://etherscan.io/', // this won't work, only here so we can see links during development
    homeEtherscan: 'https://ropsten.etherscan.io/', // this won't work, only here so we can see links during development
    feathersConnection: 'http://localhost:3030',
    foreignNodeConnection: 'http://localhost:8546',
    foreignNetworkName: 'Foreign Ganache',
    foreignNetworkId: 67,
    homeNetworkName: 'Home Ganache',
    homeNetworkId: 66,
    ipfsGateway: 'http://localhost:8080/ipfs/',
    sendErrors: false,
    analytics: {
      ga_UA: 'UA-103956937-3',
      useGoogleAnalytics: true,
      useHotjar: false,
    },
    nativeTokenName: 'ETH',
  },
  develop: {
    title: 'develop',
    liquidPledgingAddress: '0xf0e0F5A752f69Ee6dCfEed138520f6821357dc32',
    lppCampaignFactoryAddress: '0x3FE8A2f8FE8F5846A428F46B29F3Ed57D23bf2A4',
    lppCappedMilestoneFactoryAddress: '0x3293E0B22b63550994e994E729C0A98610fD0E2f',
    givethBridgeAddress: '0x279277482F13aeF92914317a0417DD591145aDc9',
    foreignGivethBridgeAddress: '0x74f2b28994e9bd00A3B6CD1826Fd29AB76f840F9',
    tokenAddresses: { 'Ropsten ETH': '0x387871cf72c8CC81E3a945402b0E3A2A6C0Ed38a' },
    etherscan: 'https://rinkeby.etherscan.io/',
    homeEtherscan: 'https://ropsten.etherscan.io/',
    feathersConnection: 'https://feathers.develop.giveth.io',
    foreignNodeConnection: 'https://rinkeby.giveth.io',
    foreignNetworkName: 'Rinkeby',
    foreignNetworkId: 4,
    homeNetworkName: 'Ropsten',
    homeNetworkId: 3,
    ipfsGateway: 'https://ipfs.giveth.io/ipfs/',
    analytics: {
      ga_UA: 'UA-103956937-5',
      useGoogleAnalytics: true,
      useHotjar: false,
    },
    nativeTokenName: 'ETH',
  },
  release: {
    title: 'release',
    liquidPledgingAddress: '0x8e17d4f6BD5fC32626B4224D0e372E380cfa1082',
    lppCampaignFactoryAddress: '0xDf1a5AEbF8b4B8a0be6a638b9FBF18FcDDA1A9f5',
    lppCappedMilestoneFactoryAddress: '0x8A20c8C505648Bfd14e5051A756ccab37912C45f',
    givethBridgeAddress: '0xC59dCE5CCC065A4b51A2321F857466A25ca49B40',
    foreignGivethBridgeAddress: '0x9423F77f919f90Ce02a063315A0F604b5D0b7aF6',
    tokenAddresses: { 'Ropsten ETH': '0x693128E9f785a380823fF00B0b21Dc80707096f5' },
    etherscan: 'https://rinkeby.etherscan.io/',
    homeEtherscan: 'https://ropsten.etherscan.io/',
    feathersConnection: 'https://feathers.release.giveth.io',
    foreignNodeConnection: 'https://rinkeby.giveth.io',
    foreignNetworkName: 'Rinkeby',
    foreignNetworkId: 4,
    homeNetworkName: 'Ropsten',
    homeNetworkId: 3,
    ipfsGateway: 'https://ipfs.giveth.io/ipfs/',
    analytics: {
      ga_UA: 'UA-103956937-4',
      useGoogleAnalytics: true,
      useHotjar: false,
    },
    nativeTokenName: 'ETH',
  },
  beta: {
    title: 'beta',
    liquidPledgingAddress: '0x8eB047585ABeD935a73ba4b9525213F126A0c979',
    lppCampaignFactoryAddress: '0x71408CE2125b1F07f614b93C8Bd0340e8Fc31CFA',
    lppCappedMilestoneFactoryAddress: '0x19e88e279844f0201079b39c736a94b87b32b6b6',
    givethBridgeAddress: '0x30f938fED5dE6e06a9A7Cd2Ac3517131C317B1E7',
    foreignGivethBridgeAddress: '0xfF9CD5140e79377feB23f6DFaF1f8b558C0FE621',
    tokenAddresses: { GivETH: '0xe3ee055346a9EfaF4AA2900847dEb04de0195398' },
    etherscan: 'https://rinkeby.etherscan.io/',
    homeEtherscan: 'https://etherscan.io/',
    feathersConnection: 'https://feathers.beta.giveth.io',
    foreignNodeConnection: 'https://rinkeby.giveth.io',
    foreignNetworkName: 'Rinkeby',
    foreignNetworkId: 4,
    homeNetworkName: 'Mainnet',
    homeNetworkId: 1,
    ipfsGateway: 'https://ipfs.giveth.io/ipfs/',
    analytics: {
      ga_UA: 'UA-103956937-2',
      useGoogleAnalytics: true,
      useHotjar: true,
    },
    nativeTokenName: 'ETH',
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
config.campaignFactoryAddress =
  REACT_APP_CAMPAIGN_FACTORY_ADDRESS || config.lppCampaignFactoryAddress;
config.cappedMilestoneFactoryAddress =
  REACT_APP_CAPPED_MILESTONE_FACTORY_ADDRESS || config.lppCappedMilestoneFactoryAddress;
config.tokenAddresses = REACT_APP_TOKEN_ADDRESSES
  ? JSON.parse(REACT_APP_TOKEN_ADDRESSES)
  : config.tokenAddresses;
config.etherscan = REACT_APP_BLOCKEXPLORER || config.etherscan;
config.feathersConnection = REACT_APP_FEATHERJS_CONNECTION_URL || config.feathersConnection;
config.foreignNodeConnection = REACT_APP_NODE_CONNECTION_URL || config.foreignNodeConnection;
config.decimals = REACT_APP_DECIMALS;
config.bugsEmail = REACT_APP_BUGS_EMAIL;
config.defaultGasPrice = REACT_APP_DEFAULT_GASPRICE;
config.networkName = REACT_APP_NETWORK_NAME || config.networkName;
config.nativeTokenName = REACT_APP_NATIVE_TOKEN_NAME || config.nativeTokenName;
config.sendErrors = ['develop', 'release', 'beta'].includes(REACT_APP_ENVIRONMENT);

export default config;
