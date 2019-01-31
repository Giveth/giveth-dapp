import { LPPCappedMilestone as LPPCappedMilestoneContract } from 'lpp-capped-milestone';
import Milestone from './Milestone';

/**
 * The DApp LPPCappedMilestone model
 */
export default class LPPCappedMilestone extends Milestone {
  constructor(data) {
    super(data);

    const {
      campaignReviewerAddress = '',

      // transient
      campaignReviewer,
    } = data;

    // transient
    this._campaignReviewer = campaignReviewer;
    this._campaignReviewerAddress = campaignReviewerAddress;
  }

  toFeathers(txHash) {
    return Object.assign({}, super.toFeathers(txHash), {
      campaignReviewerAddress: this._campaignReviewerAddress,
    });
  }

  contract(web3) {
    if (!web3) throw new Error('web3 instance is required');
    return new LPPCappedMilestoneContract(web3, this.pluginAddress);
  }

  /**
    get & setters
  * */

  set campaignReviewerAddress(value) {
    this.checkType(value, ['string'], 'campaignReviewerAddress');
    this._campaignReviewerAddress = value;
  }

  get campaignReviewerAddress() {
    return this._campaignReviewerAddress;
  }

  get campaignReviewer() {
    return this._campaignReviewer;
  }

  // computed properties

  // eslint-disable-next-line class-methods-use-this
  get hasReviewer() {
    return true;
  }
}
