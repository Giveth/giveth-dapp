/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const TestRPC = require('ganache-cli');
const chai = require('chai');
const { LPPDac, LPPDacFactory } = require('../index');
const {
  Kernel,
  ACL,
  LPVault,
  LPFactory,
  LiquidPledgingState,
  test,
} = require('giveth-liquidpledging');
const { MiniMeToken, MiniMeTokenFactory, MiniMeTokenState } = require('minimetoken');
const Web3 = require('web3');
const { StandardTokenTest, assertFail, LiquidPledgingMock } = test;

const assert = chai.assert;

describe('LPPDac test', function() {
  this.timeout(0);

  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let vault;
  let lppdacs;
  let dac;
  let dac2;
  let minime;
  let minime2;
  let minimeTokenState;
  let giver1;
  let giver2;
  let project1;
  let project2;
  let project3;
  let dacOwner1;
  let dacOwner2;
  let testrpc;
  let acl;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 9700000,
      total_accounts: 10,
    });

    testrpc.listen(8545, '127.0.0.1', err => {});

    web3 = new Web3('ws://localhost:8545');
    accounts = await web3.eth.getAccounts();

    giver1 = accounts[1];
    project1 = accounts[2];
    dacOwner1 = accounts[3];
    dacOwner2 = accounts[4];
    project2 = accounts[5];
    giver2 = accounts[6];
    project3 = accounts[7];
  });

  after(done => {
    testrpc.close();
    done();
    setTimeout(process.exit, 2000);
  });

  it('Should deploy LPPDac contract and add delegate to liquidPledging', async () => {
    const baseVault = await LPVault.new(web3, accounts[0]);
    const baseLP = await LiquidPledgingMock.new(web3, accounts[0]);
    const lpFactory = await LPFactory.new(web3, baseVault.$address, baseLP.$address);

    const r = await lpFactory.newLP(accounts[0], accounts[1], { $extraGas: 200000 });

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

    giverToken = await StandardTokenTest.new(web3);
    await giverToken.mint(giver1, web3.utils.toWei('1000'));
    await giverToken.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });
    await giverToken.mint(giver2, web3.utils.toWei('1000'));
    await giverToken.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver2 });

    const tokenFactory = await MiniMeTokenFactory.new(web3, { gas: 3000000 });
    factory = await LPPDacFactory.new(
      web3,
      kernel.$address,
      tokenFactory.$address,
      accounts[0],
      accounts[1],
      { gas: 6000000 },
    );
    await acl.grantPermission(factory.$address, acl.$address, await acl.CREATE_PERMISSIONS_ROLE(), {
      $extraGas: 200000,
    });
    await acl.grantPermission(
      factory.$address,
      liquidPledging.$address,
      await liquidPledging.PLUGIN_MANAGER_ROLE(),
      { $extraGas: 200000 },
    );

    const dacApp = await LPPDac.new(web3, accounts[0]);
    await kernel.setApp(
      await kernel.APP_BASES_NAMESPACE(),
      await factory.DAC_APP_ID(),
      dacApp.$address,
      { $extraGas: 200000 },
    );

    await factory.newDac('DAC 1', 'URL1', 0, 'DAC 1 Token', 'DAC1', accounts[0], accounts[1], {
      from: dacOwner1,
    }); // pledgeAdmin #1

    // await lppdacs.addDac('DAC 1', 'URL1', 0, 'DAC 1 Token', 'DAC1', { from: dacOwner1, gas: 6000000 });

    const lpState = await liquidPledgingState.getState();
    assert.equal(lpState.admins.length, 2);
    const lpManager = lpState.admins[1];

    dac = new LPPDac(web3, lpManager.plugin);
    // assert.equal(dac.owner, dacOwner1);

    minime = new MiniMeToken(web3, await dac.dacToken());
    minimeTokenState = new MiniMeTokenState(minime);

    assert.equal(lpManager.type, 'Delegate');
    assert.equal(lpManager.addr, dac.$address);
    assert.equal(lpManager.name, 'DAC 1');
    assert.equal(lpManager.commitTime, '0');

    assert.equal(await dac.liquidPledging(), liquidPledging.$address);

    const tState = await minimeTokenState.getState();
    assert.equal(tState.totalSupply, 0);
    assert.equal(tState.name, 'DAC 1 Token');
    assert.equal(tState.controller, dac.$address);
    assert.equal(await minime.symbol(), 'DAC1');
  });

  it('Should not generate tokens when added as pledge delegate', async function() {
    await liquidPledging.addGiver('Giver1', 'URL', 0, 0x0, { from: giver1 }); // pledgeAdmin #2
    await liquidPledging.donate(2, 1, giverToken.$address, 1000, { from: giver1 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[2].amount, 1000);
    assert.equal(st.pledges[2].token, giverToken.$address);
    assert.equal(st.pledges[2].owner, 2);

    const giverTokenBal = await minime.balanceOf(giver1);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 0);
    assert.equal(totalTokenSupply, 0);
  });

  it('Should send tokens to giver when committing to project', async function() {
    // create project
    await liquidPledging.addProject('Project1', 'URL', project1, 0, 0, 0x0, {
      from: project1,
      $extraGas: 100000,
    }); // pledgeAdmin #3
    // delegate to project1
    await dac.transfer(2, 1000, 3, { from: dacOwner1, $extraGas: 100000 });

    // set the time
    const now = Math.floor(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 100000 });

    await liquidPledging.normalizePledge(3, { $extraGas: 100000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[4].amount, 1000);
    assert.equal(st.pledges[4].owner, 3);
    assert.equal(st.pledges[3].amount, 0);
    assert.equal(st.pledges[2].amount, 0);

    const giverTokenBal = await minime.balanceOf(giver1);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 1000);
    assert.equal(totalTokenSupply, 1000);
  });

  it('Should not send tokens to giver when revoking pledge from delegate', async function() {
    // donate to delegate1
    await liquidPledging.donate(2, 1, giverToken.$address, 1000, {
      from: giver1,
      $extraGas: 100000,
    });
    await liquidPledging.transfer(2, 2, 1000, 2, { from: giver1, $extraGas: 100000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[1].amount, 1000);
    assert.equal(st.pledges[1].owner, 2);

    const giverTokenBal = await minime.balanceOf(giver1);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 1000);
    assert.equal(totalTokenSupply, 1000);
  });

  it('Should only generate tokens for first delegate in chain.', async function() {
    await factory.newDac('DAC 2', 'URL2', 0, 'DAC 2 Token', 'DAC2', accounts[0], accounts[0], {
      from: dacOwner2,
    }); // pledgeAdmin #4

    const admin = await liquidPledging.getPledgeAdmin(4);
    dac2 = new LPPDac(web3, admin.plugin);
    minime2 = new MiniMeToken(web3, await dac2.dacToken());

    // add delegate 1
    await liquidPledging.transfer(2, 1, 1000, 1, { from: giver1, $extraGas: 100000 });
    // add delegate 2
    await dac.transfer(2, 1000, 4, { from: dacOwner1, $extraGas: 100000 });

    // delegate to project1
    await dac2.transfer(5, 1000, 3, { from: dacOwner2, $extraGas: 100000 });

    // set the time
    const now = Math.floor(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 100000 });

    await liquidPledging.normalizePledge(6, { $extraGas: 100000 });

    const st = await liquidPledgingState.getState();
    // console.log(JSON.stringify(st, null, 2));
    assert.equal(st.pledges[4].amount, 1000);
    assert.equal(st.pledges[4].owner, 3);

    const giverTokenBal = await minime.balanceOf(giver1);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 2000);
    assert.equal(totalTokenSupply, 2000);

    const giverToken2Bal = await minime2.balanceOf(giver1);
    const totalToken2Supply = await minime2.totalSupply();
    assert.equal(giverToken2Bal, 0);
    assert.equal(totalToken2Supply, 0);
  });

  it('Should burn tokens if project is canceled', async function() {
    await liquidPledging.cancelProject(3, { from: project1, $extraGas: 100000 });
    // set the time
    const now = Math.floor(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 100000 });

    await liquidPledging.normalizePledge(4, { $extraGas: 100000 });

    const giverTokenBal = await minime.balanceOf(giver1);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 1000);
    assert.equal(totalTokenSupply, 1000);
  });

  it('Should not burn tokens for paid pledges if project is canceled', async function() {
    // create project
    await liquidPledging.addProject('Project2', 'URL', project2, 0, 0, 0x0, {
      from: project2,
      $extraGas: 100000,
    }); // pledgeAdmin #5
    await liquidPledging.addGiver('Giver2', '', 0, 0x0, { from: giver2, $extraGas: 100000 }); // pledgeAdmin #6
    // donate to delegate1
    await liquidPledging.donate(6, 1, giverToken.$address, 1000, {
      from: giver2,
      $extraGas: 100000,
    });
    // delegate to project2
    await dac.transfer(9, 1000, 5, { from: dacOwner1, $extraGas: 100000 });

    // commit to project 2
    await liquidPledging.transfer(6, 10, 1000, 5, { from: giver2, $extraGas: 100000 });

    // withdraw
    await liquidPledging.withdraw(11, 1000, { from: project2, $extraGas: 100000 });

    // cancel project2
    await liquidPledging.cancelProject(5, { from: project2, $extraGas: 100000 });

    // set the time
    const now = Math.floor(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 100000 });

    await liquidPledging.normalizePledge(12, { $extraGas: 100000 });

    const giverTokenBal = await minime.balanceOf(giver2);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 1000);
    assert.equal(totalTokenSupply, 2000);
  });

  it('Should update delegate', async function() {
    await dac.update('new name', 'new url', 1010, { from: dacOwner1, $extraGas: 100000 });

    const d = await liquidPledging.getPledgeAdmin(1);
    assert.equal(d.name, 'new name');
    assert.equal(d.addr, dac.$address);
    assert.equal(d.url, 'new url');
    assert.equal(d.commitTime, 1010);
  });

  it('Should restrict admin to only specified params', async function() {
    const params = [
      // id: 1 (arg 1) op: LTE(6) value: amount
      '0x0106000000000000000000000000000000000000000000000000000000000010',
    ];

    // grant restricted Admin_Role to dacOwner2
    await acl.grantPermissionP(dacOwner2, dac.$address, await dac.ADMIN_ROLE(), params, {
      from: dacOwner1,
      $extraGas: 100000,
    });

    // should only be able to transfer <= 10 tokens
    await assertFail(dac.transfer(2, 100, 4, { from: dacOwner2, gas: 6700000 }));

    await dac.transfer(2, 10, 4, { from: dacOwner2, $extraGas: 100000 });

    const st = await liquidPledgingState.getState();
    assert.equal(990, st.pledges[2].amount);
    assert.equal(10, st.pledges[5].amount);

    // dacOwner2 should not be able to update dac
    await assertFail(dac.update('I can update', 'pwned', 0, { from: dacOwner2, gas: 6700000 }));
  });

  it('Should transfer multiple tokens at once', async function() {
    await liquidPledging.addProject('Project3', 'URL', project1, 0, 0, 0x0, {
      from: project3,
      $extraGas: 100000,
    }); // pledgeAdmin #7

    const pledges = [{ amount: 100, id: 2 }, {amount: 10, id: 5}, { amount: 10, id: 2 }, { amount: 20, id: 2 }];

    // .substring is to remove the 0x prefix on the toHex result
    const encodedPledges = pledges.map(p => {
      return (
        '0x' +
        web3.utils.padLeft(web3.utils.toHex(p.amount).substring(2), 48) +
        web3.utils.padLeft(web3.utils.toHex(p.id).substring(2), 16)
      );
    });

    // dacOwner2 can only transfer < 10 for a given pledge
    await assertFail(dac.mTransfer(encodedPledges, 7, { from: dacOwner2 , gas: 6700000 }));

    await dac.mTransfer(encodedPledges, 7, { from: dacOwner1, $extraGas: 400000 });

    // 1 pledge = 474831 474589
    // 2 pledges = 945742 925601 = 20141 - 10k each
    // 3 pledges = 1212358 - 1172318 = 40k - 13k each
    // 4 pledges = 1478979 - 1419039 = 60k - 15k each

    const st = await liquidPledgingState.getState();
    const p = st.pledges[13];
    assert.equal(p.amount, 140);
    assert.equal(p.intendedProject, 7);
    assert.equal(p.delegates[0].id, 1);
  });
});
