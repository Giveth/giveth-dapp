import Web3 from 'web3';
import contracts from '../build/contracts';
import { LiquidPledging, LPVault, LPFactory, test } from 'giveth-liquidpledging';
import lpContracts from 'giveth-liquidpledging/build/contracts';
import { MiniMeToken, MiniMeTokenFactory, MiniMeTokenState } from 'minimetoken';
import config from '../src/configuration';

const { StandardTokenTest, assertFail } = test;

export default async () => {
  //run in two terminal windows:
  // ganache-cli -p 8545 -s homeNetwork -a 11
  // ganache-cli -p 8546 -s foreignNetwork -a 11

  const homeAccountPKs = [
    '0x764ef3e459923f2b06a122b03e6ccef7cf586a79d79f53215a5fea8bab6b5624',
    '0xb0d5f8801d2a8d546d551e6be380f206821a37f31c2c28dc3d865f7f2eb9cce6',
    '0x0701c1cbddf118c7f3f3c360a467ffd8d3d7de39b002076680d0670d72542152',
    '0x34f7a7c7502eacbdc255001253585134c188a1be4b27fddc4dbf85451dcee0bc',
    '0xa436d88f5ccf978136e0ff02e83aca5ba18300efce1044cd73d344139e17faca',
    '0x045c949b195e8a647f0d741b0d0819b452f6acf9a2d2d99896226fec2a5ff0e0',
    '0x909baff422a8c3935fd978d11928f2071cefefdf7a09b3a69b7315999f0fedfb',
    '0x39b0ab499144b218cbf39a17766e17a1225c21e0d67a96bfe03a1a9a08ac242b',
    '0xf1e412732986999372492d9fe69aa61141840a5a26e8df2985ff023154ce635e',
    '0x1517b8b95aac33a55babf9612d08747bda6c2584599ab81d5194381d58e06667',
    '0xa686f298b55d103852ae37d757cd2012f14c2abce421a15e033e5c4aef8ba40c'
  ];


  const homeWeb3 = new Web3('http://localhost:8545');
  const foreignWeb3 = new Web3('http://localhost:8546');

  // get accounts
  const homeAccounts = await homeWeb3.eth.getAccounts();
  const foreignAccounts = await foreignWeb3.eth.getAccounts();

  const a = await homeWeb3.eth.accounts.privateKeyToAccount(config.pk);
  await homeWeb3.eth.sendTransaction({ from: homeAccounts[10], to: a.address, value: 10000000000000000000 });
  await foreignWeb3.eth.sendTransaction({ from: foreignAccounts[10], to: a.address, value: 10000000000000000000 });
  homeWeb3.eth.accounts.wallet.add(a);
  foreignWeb3.eth.accounts.wallet.add(a);
  homeAccounts.pop();
  foreignAccounts.pop();

  for (var i = 0; i < homeAccounts.length; i++) {
    await foreignWeb3.eth.sendTransaction({ from: foreignAccounts[i], to: homeAccounts[i], value: 50000000000000000000 });
    const a = foreignWeb3.eth.accounts.privateKeyToAccount(homeAccountPKs[i]);
    foreignWeb3.eth.accounts.wallet.add(a);
  }

  const tokenFactory = await MiniMeTokenFactory.new(foreignWeb3, { gas: 3000000 });

  const baseVault = await LPVault.new(foreignWeb3, foreignAccounts[0]);
  const baseLP = await LiquidPledging.new(foreignWeb3, foreignAccounts[0]);
  const lpFactory = await LPFactory.new(foreignWeb3, baseVault.$address, baseLP.$address);

  const r = await lpFactory.newLP(foreignAccounts[0], foreignAccounts[1], { $extraGas: 200000 });

  const vaultAddress = r.events.DeployVault.returnValues.vault;
  const vault = new LPVault(foreignWeb3, vaultAddress);

  const lpAddress = r.events.DeployLiquidPledging.returnValues.liquidPledging;
  const liquidPledging = new LiquidPledging(foreignWeb3, lpAddress);

  // set permissions
  const vaultOwner = foreignAccounts[2];
  const foreignBridgeOwner = a.address;

  const kernel = new lpContracts.Kernel(foreignWeb3, await liquidPledging.kernel());
  const acl = new lpContracts.ACL(foreignWeb3, await kernel.acl());
  await acl.createPermission(vaultOwner, vault.$address, await vault.CONFIRM_PAYMENT_ROLE(), vaultOwner, { $extraGas: 200000 });
  await acl.createPermission(vaultOwner, vault.$address, await vault.SET_AUTOPAY_ROLE(), vaultOwner, { $extraGas: 200000 });
  await vault.setAutopay(true, { from: vaultOwner, $extraGas: 100000 });

  // deploy bridges
  const foreignBridge = await contracts.ForeignGivethBridge.new(foreignWeb3, foreignAccounts[0], foreignAccounts[0], tokenFactory.$address, liquidPledging.$address, { from: foreignBridgeOwner, $extraGas: 100000 });
  const homeBridgeOwner = homeAccounts[1];
  const securityGuard = homeAccounts[2];

  let fiveDays = 60 * 60 * 24 * 5;
  const homeBridge = await contracts.GivethBridgeMock.new(homeWeb3, homeAccounts[0], homeAccounts[0], 1, 10000, securityGuard, fiveDays, { from: homeBridgeOwner, $extraGas: 100000 });

  await homeBridge.authorizeSpender(a.address, true, { from: homeBridgeOwner });

  const homeToken1 = await StandardTokenTest.new(homeWeb3);

  // deploy tokens
  await foreignBridge.addToken(0, 'Foreign ETH', 18, 'FETH', { from: foreignBridgeOwner });
  const foreignEthAddress = await foreignBridge.tokenMapping(0);
  const foreignEth = new MiniMeToken(foreignWeb3, foreignEthAddress);

  return {
    homeWeb3,
    foreignWeb3,
    homeAccounts,
    foreignAccounts,
    vault,
    liquidPledging,
    foreignBridge,
    foreignBridgeOwner,
    vaultOwner,
    foreignEth,
    homeBridge,
    homeBridgeOwner,
    securityGuard,
    homeToken1,
  }
}
