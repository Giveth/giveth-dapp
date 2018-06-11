/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const TestRPC = require('ganache-cli');
const { assert } = require('chai');
const { LPPCappedMilestone, LPPCappedMilestoneFactory } = require('../index');
const {
  Kernel,
  ACL,
  LPVault,
  LPFactory,
  test,
  LiquidPledgingState,
} = require('giveth-liquidpledging');
const { MiniMeToken, MiniMeTokenFactory, MiniMeTokenState } = require('minimetoken');
const Web3 = require('web3');
const { StandardTokenTest, LiquidPledgingMock, assertFail } = test;

const { utils } = Web3;

const printLPState = async liquidPledgingState => {
  const st = await liquidPledgingState.getState();
  console.log(JSON.stringify(st, null, 2));
};

const printBalances = async liquidPledging => {
  const st = await liquidPledging.getState();
  assert.equal(st.pledges.length, 13);
  for (let i = 1; i <= 12; i += 1) {
    console.log(i, ethConnector.web3.fromWei(st.pledges[i].amount).toNumber());
  }
};

describe('LPPCappedMilestone test', function() {
  this.timeout(0);

  let testrpc;
  let web3;
  let accounts;
  let liquidPledging;
  let liquidPledgingState;
  let kernel;
  let vault;
  let milestones;
  let escapeHatchCaller;
  let escapeHatchDestination;
  let lpManager;
  let giver1;
  let giver2;
  let delegate1;
  let milestoneManager1;
  let recipient1;
  let recipient2;
  let reviewer1;
  let reviewer2;
  let campaignReviewer1;
  let campaignReviewer2;
  let reviewTimeoutSeconds = 5 * 24 * 60 * 60; // 5 days
  let reviewTimeout;
  let maxAmount = 100;
  let idReceiver = 1;
  let idGiver1;
  let idGiver2;
  let newReviewer;
  let newRecipient;
  let completed;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 9700000,
      total_accounts: 11,
    });

    testrpc.listen(8545, '127.0.0.1', err => {});

    web3 = new Web3('ws://localhost:8545');
    accounts = await web3.eth.getAccounts();

    escapeHatchCaller = accounts[0];
    escapeHatchDestination = accounts[1];
    giver1 = accounts[2];
    giver2 = accounts[3];
    milestoneManager1 = accounts[4];
    recipient1 = accounts[5];
    reviewer1 = accounts[6];
    campaignReviewer1 = accounts[7];
    recipient2 = accounts[8];
    reviewer2 = accounts[9];
    campaignReviewer2 = accounts[10];
  });

  after(done => {
    testrpc.close();
    done();
  });

  it('Should deploy LiquidPledging contract', async () => {
    const baseVault = await LPVault.new(web3, accounts[0]);
    const baseLP = await test.LiquidPledgingMock.new(web3, accounts[0]);
    const lpFactory = await LPFactory.new(web3, baseVault.$address, baseLP.$address);

    const r = await lpFactory.newLP(accounts[0], accounts[1], { $extraGas: 200000 });

    const vaultAddress = r.events.DeployVault.returnValues.vault;
    vault = new LPVault(web3, vaultAddress);

    const lpAddress = r.events.DeployLiquidPledging.returnValues.liquidPledging;
    liquidPledging = new test.LiquidPledgingMock(web3, lpAddress);

    liquidPledgingState = new LiquidPledgingState(liquidPledging);

    // set permissions
    kernel = new Kernel(web3, await liquidPledging.kernel());
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

    // generate token for Giver
    giver1Token = await StandardTokenTest.new(web3);
    await giver1Token.mint(giver1, web3.utils.toWei('1000'));
    await giver1Token.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });

    // generate random token
    someRandomToken = await StandardTokenTest.new(web3);
    await someRandomToken.mint(giver1, web3.utils.toWei('1000'));
    await someRandomToken.approve(liquidPledging.$address, '0xFFFFFFFFFFFFFFFF', { from: giver1 });

    factory = await LPPCappedMilestoneFactory.new(
      web3,
      kernel.$address,
      escapeHatchCaller,
      giver1,
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

    const milestoneApp = await LPPCappedMilestone.new(web3, escapeHatchCaller);
    await kernel.setApp(
      await kernel.APP_BASES_NAMESPACE(),
      await factory.MILESTONE_APP_ID(),
      milestoneApp.$address,
      { $extraGas: 200000 },
    );

    await factory.newMilestone(
      'Milestone 1',
      'URL1',
      0,
      reviewer1,
      escapeHatchCaller,
      giver1,
      recipient1,
      campaignReviewer1,
      milestoneManager1,
      maxAmount,
      giver1Token.$address,
      reviewTimeoutSeconds,
    );

    const lpState = await liquidPledgingState.getState();
    assert.equal(lpState.admins.length, 2);
    lpManager = lpState.admins[1];

    milestone = new LPPCappedMilestone(web3, lpManager.plugin);

    assert.equal(lpManager.type, 'Project');
    assert.equal(lpManager.addr, milestone.$address);
    assert.equal(lpManager.name, 'Milestone 1');
    assert.equal(lpManager.commitTime, '0');
    assert.equal(lpManager.canceled, false);
  });

  it('Should have initialized a milestone correctly', async () => {
    const mReviewer = await milestone.reviewer();
    const mCampaignReviewer = await milestone.campaignReviewer();
    const mMilestoneManager = await milestone.milestoneManager();
    const mRecipient = await milestone.recipient();
    const mMaxAmount = await milestone.maxAmount();
    const mAccepted = await milestone.completed();

    assert.equal(mReviewer, reviewer1);
    assert.equal(mCampaignReviewer, campaignReviewer1);
    assert.equal(mMilestoneManager, milestoneManager1);
    assert.equal(mRecipient, recipient1);
    assert.equal(mMaxAmount, maxAmount);
    assert.equal(mAccepted, false);
  });

  it('Should accept a donation', async () => {
    const donationAmount = 95;
    await liquidPledging.addGiver('Giver1', 'URL', 0, 0x0, { from: giver1 });
    idGiver1 = 2;
    await liquidPledging.donate(idGiver1, idReceiver, giver1Token.$address, donationAmount, {
      from: giver1,
      $extraGas: 100000,
    });

    const donation = await liquidPledging.getPledge(2);
    assert.equal(donation.amount, donationAmount);
    assert.equal(donation.token, giver1Token.$address);
    assert.equal(donation.owner, idReceiver);
  });

  it('Should only accept funds on delegation commit', async () => {
    const receivedBeforeDelegation = await milestone.received();
    const idGiver1 = 2;
    const idDelegate1 = 3;
    const donationAmount = 5;

    // create delegate1
    await liquidPledging.addDelegate('Delegate1', 'URLDelegate1', 0, 0, {
      from: delegate1,
      gas: 4000000,
    }); // admin 3

    // giver1 donates to delegate1
    await liquidPledging.donate(idGiver1, idDelegate1, giver1Token.$address, donationAmount, {
      from: giver1,
      gas: 4000000,
    }); // pledge 3

    // set the time
    const now = Math.round(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 200000 });

    // delegate1 transfers the pledge to the milestone
    await liquidPledging.transfer(idDelegate1, 3, donationAmount, 1, {
      from: delegate1,
      gas: 4000000,
    }); // pledge 4

    // the funds are not accepted
    const receivedBeforeCommittingDelegation = await milestone.received();
    assert.equal(receivedBeforeDelegation, receivedBeforeCommittingDelegation);

    // giver1 commits the funds
    res = await liquidPledging.setMockedTime(now + 86401, { $extraGas: 200000 });
    await liquidPledging.normalizePledge(4, { $extraGas: 200000 }); // pledge 5

    // milestone received changed from 95 to 100
    const receivedAfterCommittingDelegation = await milestone.received();
    assert.notEqual(receivedBeforeDelegation, receivedAfterCommittingDelegation);
    assert.equal(receivedAfterCommittingDelegation, 100);

    // check pledges
    // a new pledge is created with the owner the project
    const delegatedDonation = await liquidPledging.getPledge(5);
    assert.equal(delegatedDonation.amount, donationAmount);
    assert.equal(delegatedDonation.token, giver1Token.$address);
    assert.equal(delegatedDonation.owner, 1);
  });

  it('Should refund any excess donations', async () => {
    // check received state of milestone
    const mReceivedBefore = await milestone.received();

    const donationAmount = 100;
    await liquidPledging.donate(idGiver1, idReceiver, giver1Token.$address, donationAmount, {
      from: giver1,
      $extraGas: 100000,
    });

    // check received state of milestone
    const mReceivedAfter = await milestone.received();
    assert.equal(mReceivedAfter, mReceivedBefore);

    // donor should have his excess donationAmount back
    const refundedDonation = await liquidPledging.getPledge(1);
    assert.equal(refundedDonation.amount, donationAmount);
  });

  it('Should not accept some random tokens', async () => {
    // check received state of milestone
    const mReceivedBefore = await milestone.received();

    const donationAmount = 100;
    await liquidPledging.donate(idGiver1, idReceiver, someRandomToken.$address, donationAmount, {
      from: giver1,
      $extraGas: 100000,
    });

    // check received state of milestone
    const mReceivedAfter = await milestone.received();
    assert.equal(mReceivedAfter, mReceivedBefore);
  });

  it('Should not be able to withdraw non-completed milestone', async () => {
    const lpState = await liquidPledgingState.getState();

    const pledges = [{ amount: 100, id: 2 }];

    // .substring is to remove the 0x prefix on the toHex result
    const encodedPledges = pledges.map(p => {
      return (
        '0x' +
        utils.padLeft(utils.toHex(p.amount).substring(2), 48) +
        utils.padLeft(utils.toHex(p.id).substring(2), 16)
      );
    });

    // both multiple pledges as a single pledge withdraw must fail
    await assertFail(milestone.mWithdraw(encodedPledges, { from: recipient1, gas: 4000000 }));
    await assertFail(milestone.withdraw(2, 100, { from: recipient1, gas: 4000000 }));
  });

  it('Milestone Manager can request a milestone as complete', async () => {
    // check that other roles cannot mark as complete
    await assertFail(milestone.requestMarkAsComplete({ from: reviewer1, gas: 4000000 }));
    await assertFail(milestone.requestMarkAsComplete({ from: giver1, gas: 4000000 }));

    // check that state of milestone didn't change
    requestComplete = await milestone.requestComplete();
    completed = await milestone.completed();
    reviewTimeout = await milestone.reviewTimeout();
    assert.equal(requestComplete, false);
    assert.equal(reviewTimeout, 0);
    assert.equal(completed, false);

    // milestone manager can request mark as complete
    await milestone.requestMarkAsComplete({ from: milestoneManager1, gas: 4000000 });

    // check that state of milestone changed
    requestComplete = await milestone.requestComplete();
    completed = await milestone.completed();
    reviewTimeout = await milestone.reviewTimeout();
    assert.equal(requestComplete, true);
    assert.notEqual(reviewTimeout, 0);
    assert.equal(completed, false);
  });

  it('Only Reviewer can reject a milestone as complete', async () => {
    // request mark as complete
    await milestone.requestMarkAsComplete({ from: milestoneManager1, gas: 4000000 });

    // check that other roles cannot reject completion
    await assertFail(milestone.rejectCompleteRequest({ from: giver1, gas: 4000000 }));
    await assertFail(milestone.rejectCompleteRequest({ from: milestoneManager1, gas: 4000000 }));

    // check that state of milestone didn't change
    completed = await milestone.completed();
    reviewTimeout = await milestone.reviewTimeout();
    assert.notEqual(reviewTimeout, 0);
    assert.equal(completed, false);

    // reviewer can reject complete request
    await milestone.rejectCompleteRequest({ from: reviewer1, gas: 4000000 });

    // check that state of milestone changed
    completed = await milestone.completed();
    reviewTimeout = await milestone.reviewTimeout();
    assert.equal(reviewTimeout, 0);
    assert.equal(completed, false);
  });

  it('Recipient can also request a milestone as complete', async () => {
    // mark as complete
    await milestone.requestMarkAsComplete({ from: recipient1, gas: 4000000 }); 

    // check that state of milestone changed
    requestComplete = await milestone.requestComplete();
    completed = await milestone.completed();
    reviewTimeout = await milestone.reviewTimeout();
    assert.equal(requestComplete, true);
    assert.notEqual(reviewTimeout, 0);
    assert.equal(completed, false);

  })

  it('Only Reviewer can mark a milestone as complete', async () => {
    // check that other roles cannot approve completion
    await assertFail(milestone.approveMilestoneCompleted({ from: recipient1, gas: 4000000 }));
    await assertFail(
      milestone.approveMilestoneCompleted({ from: milestoneManager1, gas: 4000000 }),
    );

    // check that state of milestone changed
    completed = await milestone.completed();
    assert.equal(completed, false);

    // only reviewer can mark as complete
    await milestone.approveMilestoneCompleted({ from: reviewer1, gas: 4000000 });

    // check that state of milestone changed
    completed = await milestone.completed();
    assert.equal(completed, true);
  });

  it('Completed milestone should not accept any donation', async () => {
    const donationAmount = 45;

    // check milestone state before donation
    let mReceived = await milestone.received();
    assert.equal(mReceived, 100);

    await liquidPledging.donate(idGiver1, idReceiver, giver1Token.$address, donationAmount, {
      from: giver1,
      $extraGas: 100000,
    });

    // donor should have his donationAmount back
    const refundedDonation = await liquidPledging.getPledge(1);
    assert.equal(refundedDonation.amount, 100 + donationAmount);
    assert.equal(refundedDonation.token, giver1Token.$address);
    assert.equal(refundedDonation.owner, idGiver1);

    // check received state of milestone after donation
    mReceived = await milestone.received();
    assert.equal(mReceived, 100);
  });

  it('Only recipient should be able to withdraw', async () => {
    received = await milestone.received();

    const pledges = [{ amount: 50, id: 2 }];

    // .substring is to remove the 0x prefix on the toHex result
    const encodedPledges = pledges.map(p => {
      return (
        '0x' +
        utils.padLeft(utils.toHex(p.amount).substring(2), 48) +
        utils.padLeft(utils.toHex(p.id).substring(2), 16)
      );
    });

    // check roles other than recipient cannot withdraw
    await assertFail(
      milestone.mWithdraw(encodedPledges, { from: milestoneManager1, gas: 4000000 }),
    );
    await assertFail(milestone.mWithdraw(encodedPledges, { from: giver1, gas: 4000000 }));
    await assertFail(milestone.mWithdraw(encodedPledges, { from: reviewer1, gas: 4000000 }));

    // recipient can withdraw
    res = await milestone.mWithdraw(encodedPledges, { from: recipient1, gas: 4000000 });
    assert.equal(res.status, '0x01');

    // recipient can withdraw a single pledge
    res = await milestone.withdraw(2, 20, { from: recipient1, gas: 4000000 });
    assert.equal(res.status, '0x01');    
  });

  it('Only reviewer can request changing reviewer', async () => {
    await assertFail(milestone.requestChangeReviewer(giver1, { from: giver1, gas: 4000000 }));
    await assertFail(
      milestone.requestChangeReviewer(giver1, { from: milestoneManager1, gas: 4000000 }),
    );
    await assertFail(milestone.requestChangeReviewer(giver1, { from: recipient1, gas: 4000000 }));

    newReviewer = await milestone.newReviewer();
    assert.equal(newReviewer, '0x0000000000000000000000000000000000000000');

    await milestone.requestChangeReviewer(reviewer2, { from: reviewer1, gas: 4000000 });
    newReviewer = await milestone.newReviewer();
    assert.equal(newReviewer, reviewer2);
  });

  it('Only the new reviewer can accept becoming the new reviewer', async () => {
    await assertFail(milestone.acceptNewReviewerRequest({ from: reviewer1, gas: 4000000 }));
    await assertFail(milestone.acceptNewReviewerRequest({ from: milestoneManager1, gas: 4000000 }));
    await assertFail(milestone.acceptNewReviewerRequest({ from: recipient1, gas: 4000000 }));

    reviewer = await milestone.reviewer();
    assert.equal(reviewer, reviewer1);

    await milestone.acceptNewReviewerRequest({ from: reviewer2, gas: 4000000 });
    reviewer = await milestone.reviewer();
    newReviewer = await milestone.newReviewer();
    assert.equal(reviewer, reviewer2);
    assert.equal(newReviewer, 0);
  });


 it('Only the campaign reviewer can request changing campaign reviewer', async () => {
    await assertFail(milestone.requestChangeCampaignReviewer(giver1, { from: giver1, gas: 4000000 }));
    await assertFail(
      milestone.requestChangeCampaignReviewer(giver1, { from: milestoneManager1, gas: 4000000 }),
    );
    await assertFail(milestone.requestChangeCampaignReviewer(giver1, { from: recipient1, gas: 4000000 }));

    newCampaignReviewer = await milestone.newCampaignReviewer();
    assert.equal(newCampaignReviewer, '0x0000000000000000000000000000000000000000');

    await milestone.requestChangeCampaignReviewer(campaignReviewer2, { from: campaignReviewer1, gas: 4000000 });
    newCampaignReviewer = await milestone.newCampaignReviewer();
    assert.equal(newCampaignReviewer, campaignReviewer2);
  });

  it('Only the new campaign reviewer can accept becoming the new campaign reviewer', async () => {
    await assertFail(milestone.acceptNewCampaignReviewerRequest({ from: campaignReviewer1, gas: 4000000 }));
    await assertFail(milestone.acceptNewCampaignReviewerRequest({ from: milestoneManager1, gas: 4000000 }));
    await assertFail(milestone.acceptNewCampaignReviewerRequest({ from: recipient1, gas: 4000000 }));

    campaignReviewer = await milestone.campaignReviewer();
    assert.equal(campaignReviewer, campaignReviewer1);

    await milestone.acceptNewCampaignReviewerRequest({ from: campaignReviewer2, gas: 4000000 });
    campaignReviewer = await milestone.campaignReviewer();
    newCampaignReviewer = await milestone.newCampaignReviewer();
    assert.equal(campaignReviewer, campaignReviewer2);
    assert.equal(newCampaignReviewer, 0);
  });


  it('Only reviewer can request changing recipient', async () => {
    await assertFail(
      milestone.requestChangeRecipient(recipient2, { from: recipient1, gas: 4000000 }),
    );
    await assertFail(
      milestone.requestChangeRecipient(recipient2, { from: milestoneManager1, gas: 4000000 }),
    );
    await assertFail(
      milestone.requestChangeRecipient(recipient2, { from: reviewer1, gas: 4000000 }),
    );

    newRecipient = await milestone.newRecipient();
    assert.equal(newRecipient, '0x0000000000000000000000000000000000000000');

    await milestone.requestChangeRecipient(recipient2, { from: reviewer2, gas: 4000000 });
    newRecipient = await milestone.newRecipient();
    assert.equal(newRecipient, recipient2);
  });

  it('Only the new recipient can accept becoming the new recipient', async () => {
    await assertFail(milestone.acceptNewRecipient({ from: reviewer2, gas: 4000000 }));
    await assertFail(milestone.acceptNewRecipient({ from: milestoneManager1, gas: 4000000 }));
    await assertFail(milestone.acceptNewRecipient({ from: recipient1, gas: 4000000 }));

    recipient = await milestone.recipient();
    assert.equal(recipient, recipient1);

    await milestone.acceptNewRecipient({ from: recipient2, gas: 4000000 });
    recipient = await milestone.recipient();
    newRecipient = await milestone.newRecipient();
    assert.equal(recipient, recipient2);
    assert.equal(newRecipient, 0);
  });

  it('Should not accept delegate funds if completed', async () => {
    const receivedBeforeDelegation = await milestone.received();

    // set the time
    const now = Math.round(new Date().getTime() / 1000);
    await liquidPledging.setMockedTime(now, { $extraGas: 200000 });

    const idDelegate1 = 3;
    const donationAmount = 250;
    await liquidPledging.donate(idGiver1, idDelegate1, giver1Token.$address, donationAmount, {
      from: giver1,
      gas: 4000000,
    }); // pledge 3

    // delegate1 transfers the pledge to the milestone
    await liquidPledging.transfer(idDelegate1, 3, donationAmount, 1, {
      from: delegate1,
      gas: 4000000,
    }); // pledge 5

    // the funds are not accepted
    const receivedBeforeCommittingDelegation = await milestone.received();
    assert.equal(receivedBeforeDelegation, receivedBeforeCommittingDelegation);

    // giver1 commits the funds
    res = await liquidPledging.setMockedTime(now + 86401, { $extraGas: 200000 });
    await liquidPledging.normalizePledge(3, { $extraGas: 200000 });

    // funds are still at the delegate
    const delegatePledge = await liquidPledging.getPledge(3);
    assert.equal(delegatePledge.amount, donationAmount);

    // milestone received is still the same
    const receivedAfterDelegation = await milestone.received();
    assert.equal(receivedBeforeDelegation, receivedAfterDelegation);
  });

  it('Nobody else but Reviewer and Milestone Manager can cancel milestone', async () => {
    await assertFail(milestone.cancelMilestone({ from: recipient2, gas: 4000000 }));
    await assertFail(milestone.cancelMilestone({ from: giver1, gas: 4000000 }));

    // reviewer can cancel
    await milestone.cancelMilestone({ from: reviewer2, gas: 4000000 });

    let canceled = await liquidPledging.isProjectCanceled(1, { gas: 400000 });
    assert.equal(canceled, true);

    // create a new milestone - admin4
    await factory.newMilestone(
      'Milestone 2',
      'URL1',
      0,
      reviewer1,
      escapeHatchCaller,
      giver1,
      recipient1,
      campaignReviewer1,
      milestoneManager1,
      1000,
      giver1Token.$address,
      reviewTimeoutSeconds,
    );

    const lpState = await liquidPledgingState.getState();
    lpManager = lpState.admins[4];

    milestone = new LPPCappedMilestone(web3, lpManager.plugin);

    // milestone manager can cancel
    await milestone.cancelMilestone({ from: milestoneManager1, gas: 4000000 });

    canceled = await liquidPledging.isProjectCanceled(4, { gas: 400000 });
    assert.equal(canceled, true);
  });

  it('A canceled milestone cannot be canceled again', async () => {
    await assertFail(milestone.cancelMilestone({ from: milestoneManager1, gas: 4000000 }));
  });

  it('Canceled milestone should not accept new donations', async () => {
    receivedBeforeDonation = await milestone.received();

    // donate to milestone
    await liquidPledging.donate(2, 4, giver1Token.$address, 150, { from: giver1, gas: 4000000 });

    // donation is not accepted
    receivedAfterDonation = await milestone.received();
    assert.equal(receivedBeforeDonation, receivedAfterDonation);
  });
});
