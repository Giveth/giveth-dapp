/* eslint-disable class-methods-use-this */
import { LPMilestone as LPMilestoneContract } from 'lpp-milestones';
import Trace from './Trace';

/**
 * The DApp LPTrace model
 */
export default class LPTrace extends Trace {
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

  get traceType() {
    return 'LPTrace';
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
      user.address &&
      [this.reviewerAddress, this.ownerAddress].includes(user.address) &&
      ![Trace.PROPOSED, Trace.REJECTED, Trace.PENDING, Trace.ARCHIVED, Trace.CANCELED].includes(
        this._status,
      ) &&
      this.mined
    );
  }

  canUserWithdraw(user) {
    return (
      user &&
      this.ownerAddress === user.address &&
      (!this.hasReviewer || this.status === Trace.COMPLETED) &&
      this.mined &&
      this.donationCounters.some(dc => dc.currentBalance.gt(0)) &&
      this.status !== Trace.CANCELED
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
