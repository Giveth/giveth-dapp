/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const TestRPC = require('ganache-cli');
const { LPPCampaign, LPPCampaignFactory } = require('../index');
const {
  Kernel,
  ACL,
  LPVault,
  LiquidPledging,
  LPFactory,
  test,
  LiquidPledgingState,
} = require('giveth-liquidpledging');
const LPPCampaignState = require('../lib/LPPCampaignState');
const { MiniMeToken, MiniMeTokenFactory, MiniMeTokenState } = require('minimetoken');
const Web3 = require('web3');
const { assert } = require('chai');

const { StandardTokenTest, assertFail } = test;

describe('LPPCampaign test', function() {
  this.timeout(0);

  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let vault;
  let factory;
  let campaign;
  let campaignState;
  let acl;
  let minime;
  let minimeTokenState;
  let giver1;
  let giver2;
  let project1;
  let campaignOwner1;
  let reviewer1;
  let reviewer2;
  let testrpc;
  let giver1Token;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 9700000,
      total_accounts: 10,
    });

    testrpc.listen(8545, '127.0.0.1', err => {});

    web3 = new Web3('http://localhost:8545');
    accounts = await web3.eth.getAccounts();

    giver1 = accounts[1];
    project1 = accounts[2];
    campaignOwner1 = accounts[3];
    reviewer1 = accounts[4];
    reviewer2 = accounts[5];
    giver2 = accounts[6];
  });

  after(done => {
    testrpc.close();
    done();
    setTimeout(process.exit, 2000);
  });

  it('Should deploy LPPCampaign contract and add project to liquidPledging', async () => {
    const baseVault = await LPVault.new(web3, accounts[0]);
    const baseLP = await LiquidPledging.new(web3, accounts[0]);
    const lpFactory = await LPFactory.new(web3, baseVault.$address, baseLP.$address);

    const r = await lpFactory.newLP(accounts[0], accounts[1], { $extraGas: 200000 });

    const vaultAddress = r.events.DeployVault.returnValues.vault;
    vault = new LPVault(web3, vaultAddress);

    const lpAddress = r.events.DeployLiquidPledging.returnValues.liquidPledging;
    liquidPledging = new LiquidPledging(web3, lpAddress);

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

    giver1Token = await StandardTokenTest.new(web3);
    await giver1Token.mint(giver1, web3.utils.toWei('1000'));
    await giver1Token.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });

    const tokenFactory = await MiniMeTokenFactory.new(web3, { gas: 3000000 });
    factory = await LPPCampaignFactory.new(
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

    const campaignApp = await LPPCampaign.new(web3, accounts[0]);
    await kernel.setApp(
      await kernel.APP_BASES_NAMESPACE(),
      await factory.CAMPAIGN_APP_ID(),
      campaignApp.$address,
      { $extraGas: 200000 },
    );

    await factory.newCampaign(
      'Campaign 1',
      'URL1',
      0,
      reviewer1,
      'Campaign 1 Token',
      'CPG',
      accounts[0],
      accounts[1],
      { from: campaignOwner1 },
    );

    const lpState = await liquidPledgingState.getState();
    assert.equal(lpState.admins.length, 2);
    const lpManager = lpState.admins[1];

    campaign = new LPPCampaign(web3, lpManager.plugin);
    campaignState = new LPPCampaignState(campaign);

    minime = new MiniMeToken(web3, await campaign.campaignToken());
    minimeTokenState = new MiniMeTokenState(minime);

    assert.equal(lpManager.type, 'Project');
    assert.equal(lpManager.addr, campaign.$address);
    assert.equal(lpManager.name, 'Campaign 1');
    assert.equal(lpManager.commitTime, '0');
    assert.equal(lpManager.canceled, false);

    const cState = await campaignState.getState();
    assert.equal(cState.liquidPledging, liquidPledging.$address);
    assert.equal(cState.idProject, '1');
    assert.equal(cState.reviewer, reviewer1);
    assert.equal(cState.newReviewer, '0x0000000000000000000000000000000000000000');
    assert.equal(cState.canceled, false);

    const tState = await minimeTokenState.getState();
    assert.equal(tState.totalSupply, 0);
    assert.equal(tState.name, 'Campaign 1 Token');
    assert.equal(tState.controller, campaign.$address);
    assert.equal(await minime.symbol(), 'CPG');
  });

  it('Should accept transfers if not canceled and generate tokens', async function() {
    await liquidPledging.addGiver('Giver1', 'URL', 0, 0x0, { from: giver1 }); // pledgeAdmin #2
    await liquidPledging.donate(2, 1, giver1Token.$address, 1000, { from: giver1 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[2].amount, 1000);
    assert.equal(st.pledges[2].token, giver1Token.$address);
    assert.equal(st.pledges[2].owner, 1);

    const giverTokenBal = await minime.balanceOf(giver1);
    const totalTokenSupply = await minime.totalSupply();
    assert.equal(giverTokenBal, 1000);
    assert.equal(totalTokenSupply, 1000);
  });

  it('Should be able to transfer pledge to another project', async function() {
    await liquidPledging.addProject('Project1', 'URL', project1, 0, 0, 0x0, {
      from: project1,
      $extraGas: 100000,
    }); // pledgeAdmin #3
    await campaign.transfer(2, 1000, 3, { from: campaignOwner1, $extraGas: 200000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[3].amount, 1000);
    assert.equal(st.pledges[3].owner, 3);
    assert.equal(st.pledges[2].amount, 0);
  });

  it('Should generate tokens in project -> project transfer', async function() {
    await liquidPledging.transfer(3, 3, 1000, 1, { from: project1 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[4].amount, 1000);
    assert.equal(st.pledges[3].amount, 0);

    const totalTokenSupply = await minime.totalSupply();
    assert.equal(totalTokenSupply, 2000);
  });

  it('Should be able to change reviewer', async function() {
    await campaign.changeReviewer(reviewer2, { from: reviewer1, $extraGas: 100000 });

    const st = await campaignState.getState();
    assert.equal(st.reviewer, reviewer1);
    assert.equal(st.newReviewer, reviewer2);

    await campaign.acceptNewReviewer({ from: reviewer2, $extraGas: 100000 });

    const st2 = await campaignState.getState();
    assert.equal(st2.reviewer, reviewer2);
    assert.equal(st2.newReviewer, '0x0000000000000000000000000000000000000000');
  });

  it('Owner should not be able to change reviewer', async function() {
    await assertFail(campaign.changeReviewer(reviewer1, { from: campaignOwner1, gas: 6700000 }));
  });

  it('Reviewer should be able to cancel campaign', async function() {
    await campaign.cancelCampaign({ from: reviewer2, $extraGas: 100000 });

    const canceled = await campaign.isCanceled();
    assert.equal(canceled, true);
  });

  it('Should deploy another campaign', async function() {
    campaign = await factory.newCampaign(
      'Campaign 2',
      'URL2',
      0,
      reviewer1,
      'Campaign 2 Token',
      'CPG2',
      accounts[0],
      accounts[1],
      { from: campaignOwner1 },
    ); // pledgeAdmin #4

    const nPledgeAdmins = await liquidPledging.numberOfPledgeAdmins();
    const campaign2Admin = await liquidPledging.getPledgeAdmin(nPledgeAdmins);
    campaign = new LPPCampaign(web3, campaign2Admin.plugin);

    const canceled = await campaign.isCanceled();
    assert.equal(canceled, false);
  });

  it('Should reject transfer for unapproved token', async function() {
    const token2 = await StandardTokenTest.new(web3);
    await token2.mint(giver1, web3.utils.toWei('1000'));
    await token2.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });

    const params = [
      // id: 204 (logic) op: OR(9) value: 2 or 1
      // '0xcc09000000000000000000000000000000000000000000000000000200000001',
      // id: 0 (arg 0) op: EQ(1) value: token2.$address
      `0x000100000000000000000000${token2.$address.slice(2)}`,
    ];
    await campaign.setTransferPermissions(params, { from: campaignOwner1, $extraGas: 100000 });

    await assertFail(
      liquidPledging.donate(2, 1, giver1Token.$address, 1000, { from: giver1, gas: 4000000 }),
    );

    await liquidPledging.donate(2, 4, token2.$address, 1000, { from: giver1, $extraGas: 100000 });

    const st = await liquidPledgingState.getState();
    assert.equal(st.pledges[6].amount, 1000);
    assert.equal(st.pledges[6].owner, 4);
  });

  it('Should update project', async function() {
    await campaign.update('new name', 'new url', 1010, { from: campaignOwner1, $extraGas: 100000 });

    const c = await liquidPledging.getPledgeAdmin(4);
    assert.equal(c.name, 'new name');
    assert.equal(c.addr, campaign.$address);
    assert.equal(c.url, 'new url');
    assert.equal(c.commitTime, 1010);
  });

  it('Random should not be able to cancel campaign', async function() {
    await assertFail(campaign.cancelCampaign({ from: accounts[9], gas: 6700000 }));
  });

  it('Owner should be able to cancel campaign', async function() {
    await campaign.cancelCampaign({ from: campaignOwner1, $extraGas: 100000 });

    const canceled = await campaign.isCanceled();
    assert.equal(canceled, true);
  });


  it('Should transfer multiple pledges at once', async function() {
    await factory.newCampaign(
      'Campaign 3',
      'URL3',
      0,
      reviewer1,
      'Campaign 3 Token',
      'CPG3',
      accounts[0],
      accounts[1],
      { from: campaignOwner1 },
    ); // pledgeAdmin #5

    const campaign3Admin = await liquidPledging.getPledgeAdmin(5);
    campaign = new LPPCampaign(web3, campaign3Admin.plugin);

    await liquidPledging.donate(2, 5, giver1Token.$address, 1000, { from: giver1 });

    const pledges = [{ amount: 10, id: 7 }, {amount: 9, id: 7}, { amount: 11, id: 7 }, { amount: 5, id: 7 }];

    // .substring is to remove the 0x prefix on the toHex result
    const encodedPledges = pledges.map(p => {
      return (
        '0x' +
        web3.utils.padLeft(web3.utils.toHex(p.amount).substring(2), 48) +
        web3.utils.padLeft(web3.utils.toHex(p.id).substring(2), 16)
      );
    });

    await assertFail(campaign.mTransfer(encodedPledges, 3, { from: giver1, gas: 6700000 }));

    await campaign.mTransfer(encodedPledges, 3, { from: campaignOwner1, $extraGas: 400000 });

    const st = await liquidPledgingState.getState();
    const p = liquidPledging.getPledge(8);
    assert.equal(p.amount, 35);
    assert.equal(p.oldPledge, 7);
    assert.equal(p.owner, 3);
  });
});
