const contractInfo = require('./build/LPPCappedMilestoneFactory.sol');
const generateClass = require('eth-contract-class').default;

module.exports = {
  LPPCappedMilestone: generateClass(contractInfo.LPPCappedMilestoneAbi, contractInfo.LPPCappedMilestoneByteCode),
  LPPCappedMilestoneFactory: generateClass(
    contractInfo.LPPCappedMilestoneFactoryAbi,
    contractInfo.LPPCappedMilestoneFactoryByteCode,
  ),
};