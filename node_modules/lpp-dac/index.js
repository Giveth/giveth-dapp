const contractInfo = require('./build/LPPDacFactory.sol'); // const LPPDacsByteCode = require('../build/LPPDacs.sol').LPPDacsByteCode;
const generateClass = require('eth-contract-class').default;

module.exports = {
  LPPDac: generateClass(contractInfo.LPPDacAbi, contractInfo.LPPDacByteCode),
  LPPDacFactory: generateClass(contractInfo.LPPDacFactoryAbi, contractInfo.LPPDacFactoryByteCode),
};