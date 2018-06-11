const contractInfo = require('./build/LPPCampaignFactory.sol');
const generateClass = require('eth-contract-class').default;

module.exports = {
  LPPCampaign: generateClass(contractInfo.LPPCampaignAbi, contractInfo.LPPCampaignByteCode),
  LPPCampaignFactory: generateClass(
    contractInfo.LPPCampaignFactoryAbi,
    contractInfo.LPPCampaignFactoryByteCode,
  ),
};