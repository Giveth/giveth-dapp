/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const TestRPC = require('ganache-cli');
const Web3 = require('web3');
const { assert } = require('chai');
const { LPVault, LPFactory, LiquidPledgingState, Kernel, ACL, test } = require('../index');

const { StandardTokenTest, assertFail, LiquidPledgingMock } = test;

describe('Vault test', function() {
  this.timeout(0);

  let testrpc;
  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let vault;
  let vaultOwner;
  let escapeHatchCaller;
  let escapeHatchDestination;
  let giver1;
  let adminProject1;
  let restrictedPaymentsConfirmer;
  let token;

  before(async () => {
    testrpc = TestRPC.server({
      gasLimit: 6700000,
      total_accounts: 10,
    });

    testrpc.listen(8545, '127.0.0.1');

    web3 = new Web3('http://localhost:8545');
    accounts = await web3.eth.getAccounts();
    giver1 = accounts[1];
    adminProject1 = accounts[2];
    vaultOwner = accounts[3];
    escapeHatchDestination = accounts[4];
    escapeHatchCaller = accounts[5];
    restrictedPaymentsConfirmer = accounts[6];
  });

  after(done => {
    testrpc.close();
    done();
  });

  it('Should deploy Vault contract', async function() {
    const baseVault = await LPVault.new(web3, escapeHatchDestination);
    const baseLP = await LiquidPledgingMock.new(web3, escapeHatchDestination);
    lpFactory = await LPFactory.new(web3, baseVault.$address, baseLP.$address);

    const r = await lpFactory.newLP(accounts[0], escapeHatchDestination);

    const vaultAddress = r.events.DeployVault.returnValues.vault;
    vault = new LPVault(web3, vaultAddress);

    const lpAddress = r.events.DeployLiquidPledging.returnValues.liquidPledging;
    liquidPledging = new LiquidPledgingMock(web3, lpAddress);

    liquidPledgingState = new LiquidPledgingState(liquidPledging);

    // set permissions
    const kernel = new Kernel(web3, await liquidPledging.kernel());
    acl = new ACL(web3, await kernel.acl());
    await acl.createPermission(
      accounts[0],
      vault.$address,
      await vault.CANCEL_PAYMENT_ROLE(),
      accounts[0],
      { $extraGas: 200000 },
    );
    await acl.createPermission(
      accounts[0],
      vault.$address,
      await vault.CONFIRM_PAYMENT_ROLE(),
      accounts[0],
      { $extraGas: 200000 },
    );
    await acl.grantPermission(
      escapeHatchCaller,
      vault.$address,
      await vault.ESCAPE_HATCH_CALLER_ROLE(),
      { $extraGas: 200000 },
    );
    await acl.revokePermission(
      accounts[0],
      vault.$address,
      await vault.ESCAPE_HATCH_CALLER_ROLE(),
      { $extraGas: 200000 },
    );

    await liquidPledging.addGiver('Giver1', '', 0, '0x0', { from: giver1, $extraGas: 100000 });
    await liquidPledging.addProject('Project1', '', adminProject1, 0, 0, '0x0', {
      from: adminProject1,
      $extraGas: 100000,
    });

    const nAdmins = await liquidPledging.numberOfPledgeAdmins();
    assert.equal(nAdmins, 2);

    token = await StandardTokenTest.new(web3);
    await token.mint(giver1, web3.utils.toWei('1000'));
    await token.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });
  });

  it('Should hold funds from liquidPledging', async function() {
    await liquidPledging.addGiverAndDonate(2, token.$address, 10000, {
      from: giver1,
      $extraGas: 100000,
    });

    const balance = await token.balanceOf(vault.$address);
    assert.equal(10000, balance);
  });

  it('escapeFunds should fail', async function() {
    // only vaultOwner can escapeFunds
    await assertFail(vault.escapeFunds(0x0, 1000, { gas: 4000000 }));

    // can't send more then the balance
    await assertFail(vault.escapeFunds(0x0, 11000, { from: vaultOwner, gas: 4000000 }));
  });

  it('escapeFunds should send funds to escapeHatchDestination', async function() {
    const preBalance = await token.balanceOf(escapeHatchDestination);

    await assertFail(vault.escapeFunds(0x0, 1000, { from: escapeHatchCaller, gas: 1000000 }));

    await vault.escapeFunds(token.$address, 1000, { from: escapeHatchCaller, $extraGas: 200000 });

    const vaultBalance = await token.balanceOf(vault.$address);
    assert.equal(9000, vaultBalance);

    const expected = web3.utils
      .toBN(preBalance)
      .add(web3.utils.toBN('1000'))
      .toString();
    const postBalance = await token.balanceOf(escapeHatchDestination);

    assert.equal(expected, postBalance);

    await token.transfer(vault.$address, 1000, { from: escapeHatchDestination, $extraGas: 200000 });
  });

  it('should restrict confirm payment to payments under specified amount', async function() {
    await liquidPledging.withdraw(2, 300, { from: adminProject1, $extraGas: 200000 });
    await liquidPledging.withdraw(2, 700, { from: adminProject1, $extraGas: 200000 });

    // set permission for 2nd param (p.amount) <= 300
    await acl.grantPermissionP(
      restrictedPaymentsConfirmer,
      vault.$address,
      await vault.CONFIRM_PAYMENT_ROLE(),
      ['0x010600000000000000000000000000000000000000000000000000000000012c'],
      { $extraGas: 200000 },
    );

    await assertFail(vault.confirmPayment(1, { from: restrictedPaymentsConfirmer, gas: 4000000 }));
    await vault.confirmPayment(0, { from: restrictedPaymentsConfirmer, $extraGas: 200000 });
  });
});
