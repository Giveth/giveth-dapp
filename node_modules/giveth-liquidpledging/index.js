const contractInfo = require('./build/LPFactory.sol');
const LiquidPledgingMockInfo = require('./build/LiquidPledgingMock.sol');
const LPVaultInfo = require('./build/LPVault.sol');
const StandardTokenInfo = require('./build/StandardToken.sol');
const KernelInfo = require('./build/Kernel.sol');
const ACLInfo = require('./build/ACL.sol');
const generateClass = require('eth-contract-class').default;

module.exports = {
  LiquidPledging: generateClass(
    contractInfo.LiquidPledgingAbi,
    contractInfo.LiquidPledgingByteCode,
  ),
  LPFactory: generateClass(contractInfo.LPFactoryAbi, contractInfo.LPFactoryByteCode),
  LiquidPledgingState: require('./lib/liquidPledgingState.js'),
  LPVault: generateClass(contractInfo.LPVaultAbi, contractInfo.LPVaultByteCode),
  Kernel: generateClass(KernelInfo.KernelAbi, KernelInfo.KernelByteCode),
  ACL: generateClass(ACLInfo.ACLAbi, ACLInfo.ACLByteCode),
  test: {
    StandardTokenTest: generateClass(
      StandardTokenInfo.StandardTokenAbi,
      StandardTokenInfo.StandardTokenByteCode,
    ),
    assertFail: require('./test/helpers/assertFail'),
    LiquidPledgingMock: generateClass(
      LiquidPledgingMockInfo.LiquidPledgingMockAbi,
      LiquidPledgingMockInfo.LiquidPledgingMockByteCode,
    ),
  },
};
