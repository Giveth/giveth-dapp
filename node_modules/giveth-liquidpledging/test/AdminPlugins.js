/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const TestRPC = require('ganache-cli');
const Web3 = require('web3');
const chai = require('chai');
const {
  LPVault,
  LPFactory,
  LiquidPledgingState,
  test,
} = require('../index');

const simpleProjectPluginFactoryAbi = require('../build/TestSimpleProjectPluginFactory.sol')
  .TestSimpleProjectPluginFactoryAbi;
const simpleProjectPluginFactoryByteCode = require('../build/TestSimpleProjectPluginFactory.sol')
  .TestSimpleProjectPluginFactoryByteCode;
const simpleProjectPluginRuntimeByteCode = require('../build/TestSimpleProjectPluginFactory.sol')
  .TestSimpleProjectPluginRuntimeByteCode;
const assert = chai.assert;

const { StandardTokenTest, assertFail, LiquidPledgingMock } = test;

const printState = async liquidPledgingState => {
  const st = await liquidPledgingState.getState();
  console.log(JSON.stringify(st, null, 2));
};

describe('LiquidPledging plugins test', function() {
  this.timeout(0);

  let testrpc;
  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let vault;
  let giver1;
  let adminProject1;
  let adminDelegate1;
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
    adminDelegate1 = accounts[3];
  });

  after(done => {
    testrpc.close();
    done();
  });

  it('Should deploy LiquidPledging contract', async function() {
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

  it('Should create create giver with no plugin', async function() {
    await liquidPledging.addGiver('Giver1', '', 0, '0x0', { from: adminProject1 });

    const nAdmins = await liquidPledging.numberOfPledgeAdmins();
    assert.equal(nAdmins, 1);
  });

  it('Should fail to create giver with invalid plugin', async function() {
    await assertFail(
      liquidPledging.addGiver('Giver2', '', 0, vault.$address, { from: giver1, gas: 4000000 }),
    );
  });

  it('Should fail to create delegate with invalid plugin', async function() {
    await assertFail(
      liquidPledging.addDelegate('delegate1', '', 0, liquidPledging.$address, {
        from: adminDelegate1,
        gas: 4000000,
      }),
    );
  });

  it('Should fail to create project with invalid plugin', async function() {
    await assertFail(
      liquidPledging.addProject('Project1', '', giver1, 0, 0, vault.$address, {
        from: adminProject1,
        gas: 4000000,
      }),
    );
  });

  it('Should deploy TestSimpleProjectPlugin and add project', async function() {
    // add plugin as valid plugin
    const codeHash = web3.utils.soliditySha3(simpleProjectPluginRuntimeByteCode);
    await liquidPledging.addValidPluginContract(codeHash, { $extraGas: 200000 });

    // deploy new plugin
    const factoryContract = await new web3.eth.Contract(simpleProjectPluginFactoryAbi)
      .deploy({
        data: simpleProjectPluginFactoryByteCode,
        arguments: [],
      })
      .send({ from: adminProject1, gas: 5000000 });
    factoryContract.setProvider(web3.currentProvider);

    await factoryContract.methods
      .deploy(liquidPledging.$address, 'SimplePlugin1', '', 0)
      .send({ from: adminProject1, gas: 5000000 });

    const nAdmins = await liquidPledging.numberOfPledgeAdmins();
    assert.equal(nAdmins, 2);
  });

  it('Should allow all plugins', async function() {
    await liquidPledging.useWhitelist(false, { $extraGas: 200000 });

    await liquidPledging.addGiver('Giver2', '', 0, vault.$address, { from: giver1 });

    const nAdmins = await liquidPledging.numberOfPledgeAdmins();
    assert.equal(nAdmins, 3);
  });
});
