/* eslint-disable class-methods-use-this */
import { LPMilestone as LPMilestoneContract } from 'lpp-milestones';
import Milestone from './Milestone';

/**
 * The DApp LPMilestone model
 */
export default class LPMilestone extends Milestone {
  constructor(data) {
    super(data);

    const { recipientId = undefined } = data;
    this._recipientId = recipientId;
  }

  toFeathers(txHash) {
    return {
      ...super.toFeathers(txHash),
      recipientId: this.recipientId,
    };
  }

  get milestoneType() {
    return 'LPMilestone';
  }

  get recipientId() {
    return this._recipientId;
  }

  set recipientId(value) {
    this.checkType(value, ['string'], 'recipientId');
    this._recipientId = value;
  }

  get hasRecipient() {
    return Number(this.recipientId) > 0;
  }

  canUserCancel(user) {
    return (
      user &&
      [this.reviewerAddress, this.ownerAddress].includes(user.address) &&
      ![Milestone.PROPOSED, Milestone.REJECTED, Milestone.PENDING, Milestone.ARCHIVED].includes(
        this._status,
      ) &&
      this.mined
    );
  }

  canUserWithdraw(user) {
    return (
      user &&
      this.ownerAddress === user.address &&
      (!this.hasReviewer || this.status === Milestone.COMPLETED) &&
      this.mined &&
      this.donationCounters.some(dc => dc.currentBalance.gt(0))
    );
  }

  canUserChangeRecipient() {
    return false;
  }

  contract(web3) {
    if (!web3) throw new Error('web3 instance is required');
    return new LPMilestoneContract(web3, this.pluginAddress);
  }
}
