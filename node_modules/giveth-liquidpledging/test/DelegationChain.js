/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const TestRPC = require('ganache-cli');
const Web3 = require('web3');
const { assert } = require('chai');
const { LPVault, LPFactory, LiquidPledgingState, test } = require('../index');

const { StandardTokenTest, assertFail, LiquidPledgingMock } = test;

const printState = async liquidPledgingState => {
  const st = await liquidPledgingState.getState();
  console.log(JSON.stringify(st, null, 2));
};

describe('DelegationChain test', function() {
  this.timeout(0);

  let testrpc;
  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let vault;
  let giver1;
  let giver2;
  let delegate1;
  let delegate2;
  let delegate3;
  let adminProject1;
  let token;

  const gasUsage = {};
  before(async () => {
    testrpc = TestRPC.server({
      gasLimit: 6700000,
      total_accounts: 10,
    });

    testrpc.listen(8545, '127.0.0.1');

    web3 = new Web3('http://localhost:8545');
    accounts = await web3.eth.getAccounts();
    giver1 = accounts[1];
    delegate1 = accounts[2];
    delegate2 = accounts[3];
    delegate3 = accounts[4];
    adminProject1 = accounts[5];
    giver2 = accounts[6];
  });

  after(done => {
    testrpc.close();
    done();
  });

  it('Should deploy LiquidPledging contract', async () => {
    const baseVault = await LPVault.new(web3, accounts[0]);
    const baseLP = await LiquidPledgingMock.new(web3, accounts[0]);
    lpFactory = await LPFactory.new(web3, baseVault.$address, baseLP.$address);

    const r = await lpFactory.newLP(accounts[0], accounts[0]);

    const vaultAddress = r.events.DeployVault.returnValues.vault;
    vault = new LPVault(web3, vaultAddress);

    const lpAddress = r.events.DeployLiquidPledging.returnValues.liquidPledging;
    liquidPledging = new LiquidPledgingMock(web3, lpAddress);

    liquidPledgingState = new LiquidPledgingState(liquidPledging);

    token = await StandardTokenTest.new(web3);
    await token.mint(giver1, web3.utils.toWei('1000'));
    await token.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });
  });

  it('Should add pledgeAdmins', async () => {
    await liquidPledging.addGiver('Giver1', 'URLGiver1', 86400, 0, { from: giver1 }); // pledgeAdmin 1
    await liquidPledging.addDelegate('Delegate1', 'URLDelegate1', 259200, 0, { from: delegate1 }); // pledgeAdmin 2
    await liquidPledging.addDelegate('Delegate2', 'URLDelegate2', 0, 0, { from: delegate2 }); // pledgeAdmin 3
    await liquidPledging.addDelegate('Delegate3', 'URLDelegate3', 0, 0, { from: delegate3 }); // pledgeAdmin 4
    await liquidPledging.addProject('Project1', 'URLProject1', adminProject1, 0, 0, 0, {
      from: adminProject1,
    }); // pledgeAdmin 5
    await liquidPledging.addGiver('Giver2', 'URLGiver2', 0, 0, { from: giver2 }); // pledgeAdmin 6

    const nAdmins = await liquidPledging.numberOfPledgeAdmins();
    assert.equal(nAdmins, 6);
  });

  it('Should allow previous delegate to transfer pledge', async () => {
    await liquidPledging.donate(1, 2, token.$address, 1000, { from: giver1 });
    // add delegate2 to chain
    await liquidPledging.transfer(2, 2, 1000, 3, { from: delegate1 });
    // delegate 1 transfer pledge back to self, thus undelegating delegate2
    await liquidPledging.transfer(2, 3, 1000, 2, { from: delegate1, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[2].amount, 1000);
    assert.equal(st.pledges[3].amount, 0);
  });

  it('Should allow any delegate in chain to transfer pledge and undelegate all delegates occurring later in chain', async () => {
    // add delegate2 to chain
    await liquidPledging.transfer(2, 2, 1000, 3, { from: delegate1, $extraGas: 200000 });
    // add delegate3 to chain
    await liquidPledging.transfer(3, 3, 1000, 4, { from: delegate2, $extraGas: 200000 });
    // delegate 1 transfer pledge to project1. should also undelegate all delegates occurring later in chain
    await liquidPledging.transfer(2, 4, 1000, 5, { from: delegate1, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[5].amount, 1000);
    assert.equal(st.pledges[5].intendedProject, 5);
    assert.equal(st.pledges[5].delegates.length, 1);
    assert.equal(st.pledges[5].delegates[0].id, 2);
    assert.equal(st.pledges[3].amount, 0);
    assert.equal(st.pledges[4].amount, 0);
  });

  it('Should throw if delegate2 is not in delegationChain', async () => {
    await assertFail(liquidPledging.transfer(3, 5, 1000, 1, { from: delegate2, gas: 4000000 }));
  });

  it('Delegate1 should not be able to transfer to another giver', async () => {
    await assertFail(liquidPledging.transfer(2, 5, 1000, 6, { from: delegate1, gas: 4000000 }));
  });

  it('Delegate1 should be able to transfer pledge back to owner', async () => {
    await liquidPledging.transfer(2, 5, 1000, 1, { from: delegate1, $extraGas: 200000 });
    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[1].amount, 1000);
    assert.equal(st.pledges[1].delegates.length, 0);
    assert.equal(st.pledges[5].amount, 0);
  });

  it('Delegate1 should be able to change delegation', async () => {
    // add delegate1 to chain
    await liquidPledging.transfer(1, 1, 1000, 2, { from: giver1, $extraGas: 200000 });
    // delegate1 add delegate2 to chain
    await liquidPledging.transfer(2, 2, 1000, 3, { from: delegate1, $extraGas: 200000 });
    // delegate1 remove delegate2 and add delegate3 to chain
    await liquidPledging.transfer(2, 3, 1000, 4, { from: delegate1, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[1].amount, 0);
    assert.equal(st.pledges[6].amount, 1000);
    assert.equal(st.pledges[6].delegates.length, 2);
    assert.equal(st.pledges[6].delegates[0].id, 2);
    assert.equal(st.pledges[6].delegates[1].id, 4);
  });

  it('delegate in chain should be able to delegate to previous delegate, thus undelegating themselves and any delegate after the previous delegate', async () => {
    // add delegate2 to chain
    await liquidPledging.transfer(4, 6, 1000, 3, { from: delegate3 });
    // delegate2 transfer back to delegate1, thus undelegating delegate2 & delegate3
    await liquidPledging.transfer(3, 7, 1000, 2, { from: delegate2, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[7].amount, 0);
    assert.equal(st.pledges[2].amount, 1000);
    assert.equal(st.pledges[2].delegates.length, 1);
    assert.equal(st.pledges[2].delegates[0].id, 2);
  });

  it('Should not append delegate on veto delegation', async () => {
    // propose the delegation
    await liquidPledging.transfer(2, 2, 1000, 5, { from: delegate1, $extraGas: 200000 });

    const origPledge = await liquidPledging.getPledge(2);
    assert.equal(origPledge.amount, '0');

    // veto the delegation
    await liquidPledging.transfer(1, 5, 1000, 2, { from: giver1, $extraGas: 200000 });

    const currentPledge = await liquidPledging.getPledge(2);

    assert.equal(currentPledge.amount, '1000');
    assert.equal(currentPledge.nDelegates, 1);
  });

  it('Pledge should have longest commitTime in delegation chain', async () => {
    // delegate1 add delegate2 to chain
    await liquidPledging.transfer(2, 2, 1000, 3, { from: delegate1, $extraGas: 200000 });

    // set the time
    const now = Math.floor(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 200000 });

    // propose project delegation
    await liquidPledging.transfer(3, 3, 1000, 5, { from: delegate2 });

    const pledge = await liquidPledging.getPledge(8);
    assert.equal(pledge.commitTime, now + 259200); // 259200 is longest commitTime in delegationChain
  });

  it("delegation chain should remain the same when owner veto's delegation", async () => {
    // owner veto delegation to project1
    await liquidPledging.transfer(1, 8, 1000, 3, { from: giver1, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[8].amount, 0);
    assert.equal(st.pledges[3].amount, 1000);
    assert.equal(st.pledges[3].delegates.length, 2);
    assert.equal(st.pledges[3].delegates[0].id, 2);
    assert.equal(st.pledges[3].delegates[1].id, 3);
  });

  it("delegation chain should remain the same upto delegate of reciever when owner veto's delegation", async () => {
    // propose project1 delegation
    await liquidPledging.transfer(3, 3, 1000, 5, { from: delegate2, $extraGas: 200000 });
    // owner veto delegation to project1 and remove delegate2
    await liquidPledging.transfer(1, 8, 1000, 2, { from: giver1, $extraGas: 200000 });

    const pledge = await liquidPledging.getPledge(2);
    assert.equal(pledge.amount, 1000);
  });

  it('owner should be able to transfer pledge to a new delegate at any time', async () => {
    // propose project1 delegation
    await liquidPledging.transfer(2, 2, 1000, 5, { from: delegate1 });
    // owner veto delegation to project1 and assign new delgate
    await liquidPledging.transfer(1, 9, 1000, 3, { from: giver1, $extraGas: 200000 });

    const pledge = await liquidPledging.getPledge(10);
    assert.equal(pledge.amount, 1000);
    assert.equal(pledge.nDelegates, 1);

    // owner assign new delegate w/o vetoing intendedProject
    await liquidPledging.transfer(1, 10, 1000, 2, { from: giver1, $extraGas: 100000 });
    const pledge2 = await liquidPledging.getPledge(2);
    assert.equal(pledge2.amount, 1000);
  });
});
