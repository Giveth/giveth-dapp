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

describe('LiquidPledging cancelPledge normal scenario', function() {
  this.timeout(0);

  let testrpc;
  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let vault;
  let giver1;
  let adminProject1;
  let adminProject2;
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
    adminProject2 = accounts[3];
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

  it('Should add project and donate ', async () => {
    await liquidPledging.addProject('Project1', 'URLProject1', adminProject1, 0, 0, '0x0', {
      from: adminProject1,
    });
    await liquidPledging.addGiverAndDonate(1, token.$address, 1000, { from: giver1 });

    const nAdmins = await liquidPledging.numberOfPledgeAdmins();
    assert.equal(nAdmins, 2);
  });

  it('Should only allow pledge owner to cancel pledge', async () => {
    await assertFail(liquidPledging.cancelPledge(2, 1000, { from: giver1, gas: 4000000 }));
  });

  it('Should cancel pledge and return to oldPledge', async () => {
    await liquidPledging.cancelPledge(2, 1000, { from: adminProject1, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();

    assert.equal(st.pledges[1].amount, 1000);
    assert.equal(st.pledges[2].amount, 0);
  });

  it('Should not allow to cancel pledge if oldPledge === 0', async () => {
    await assertFail(liquidPledging.cancelPledge(1, 1000, { from: giver1, gas: 4000000 }));
  });
});
