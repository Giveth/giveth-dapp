/* eslint-disable import/no-cycle */

import { toast } from 'react-toastify';
import BasicModel from './BasicModel';
import CampaignService from '../services/CampaignService';
import IPFSService from '../services/IPFSService';
import { cleanIpfsPath, ZERO_ADDRESS, ZERO_SMALL_ADDRESS } from '../lib/helpers';

/**
 * The DApp Campaign model
 */
class Campaign extends BasicModel {
  static get CANCELED() {
    return 'Canceled';
  }

  static get PENDING() {
    return 'Pending';
  }

  static get ACTIVE() {
    return 'Active';
  }

  static get type() {
    return 'campaign';
  }

  // eslint-disable-next-line class-methods-use-this
  get type() {
    return Campaign.type;
  }

  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.confirmations = data.confirmations || 0;
    this.projectId = data.projectId || 0;
    this.pluginAddress = data.pluginAddress || ZERO_ADDRESS;
    this.status = data.status || Campaign.PENDING;
    this.requiredConfirmations = data.requiredConfirmations;
    this.reviewerAddress = data.reviewerAddress;
    this.ownerAddress = data.ownerAddress;
    this._disableDonate = data.disableDonate;
    this.coownerAddress = data.coownerAddress;
    this.fundsForwarder = data.fundsForwarder || ZERO_SMALL_ADDRESS;
    this.mined = data.mined;
    this._id = data._id;
    this.commitTime = data.commitTime || 0;
    this.archivedTraces = new Set(data.archivedTraces || []);
    this.customThanksMessage = data.customThanksMessage;
    this.slug = data.slug;
    this._gasPaidUsdValue = data.gasPaidUsdValue || 0;
  }

  toIpfs() {
    return {
      title: this.title,
      description: this.description,
      communityUrl: this.communityUrl,
      image: cleanIpfsPath(this.image),
      archivedTraces: Array.from(this.archivedTraces),
      version: 1,
    };
  }

  toFeathers(txHash) {
    const campaign = {
      id: this.id,
      title: this.title,
      description: this.description,
      communityUrl: this.communityUrl,
      projectId: this.projectId,
      image: cleanIpfsPath(this.image),
      totalDonated: this.totalDonated,
      donationCount: this.donationCount,
      peopleCount: this.peopleCount,
      reviewerAddress: this.reviewerAddress,
      fundsForwarder: ZERO_SMALL_ADDRESS,
      status: this.status,
      archivedTraces: Array.from(this.archivedTraces),
    };
    if (!this.id) campaign.txHash = txHash;
    return campaign;
  }

  get isActive() {
    return this.status === Campaign.ACTIVE;
  }

  get canReceiveDonate() {
    return this.isActive && !this._disableDonate;
  }

  get isPending() {
    return this.status === Campaign.PENDING || !this.mined;
  }

  /**
   * Save the campaign to feathers and blockchain if necessary
   *
   * @param afterSave   Callback function once the campaign has been saved to feathers
   * @param afterMined  Callback function once the transaction is mined
   * @param web3        web3 instance
   */
  save(afterSave, afterMined, web3) {
    if (this.newImage) {
      return IPFSService.upload(this.image)
        .then(hash => {
          // Save the new image address and mark it as old
          this.image = hash;
          this.newImage = false;
        })
        .then(_ => CampaignService.save(this, this.owner.address, afterSave, afterMined, web3))
        .catch(_ => toast.error('Cannot connect to IPFS server. Please try again'));
    }
    return CampaignService.save(this, this.owner.address, afterSave, afterMined, web3);
  }

  /**
   * Cancel the campaign in feathers and blockchain
   *
   * @param from        Either the owner or reviewer. Whoever is canceling the campaign
   * @param afterCreate Callback function once a transaction is created
   * @param afterMined  Callback function once the transaction is mined and feathers updated
   * @param web3        web3 instance
   */
  cancel(from, afterCreate, afterMined, web3) {
    CampaignService.cancel(this, from, afterCreate, afterMined, web3);
  }

  get communityUrl() {
    return this.myCommunityUrl;
  }

  set communityUrl(value) {
    this.checkType(value, ['string'], 'communityUrl');
    this.myCommunityUrl = value;
  }

  get projectId() {
    return this.myProjectId;
  }

  set projectId(value) {
    this.checkType(value, ['number', 'string'], 'projectId');
    this.myProjectId = value;
  }

  get status() {
    return this.myStatus;
  }

  set status(value) {
    this.checkValue(value, [Campaign.PENDING, Campaign.ACTIVE, Campaign.CANCELED], 'status');
    this.myStatus = value;
    if (value === Campaign.PENDING) this.myOrder = 1;
    else if (value === Campaign.ACTIVE) this.myOrder = 2;
    else if (value === Campaign.CANCELED) this.myOrder = 3;
    else this.myOrder = 4;
  }

  get pluginAddress() {
    return this.myPluginAddress;
  }

  set pluginAddress(value) {
    this.checkType(value, ['string'], 'pluginAddress');
    this.myPluginAddress = value;
  }

  get reviewerAddress() {
    return this.myReviewerAddress;
  }

  set reviewerAddress(value) {
    this.checkType(value, ['string', 'undefined'], 'reviewerAddress');
    this.myReviewerAddress = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['number'], 'commitTime');
    this.myCommitTime = value;
  }

  get gasPaidUsdValue() {
    return this._gasPaidUsdValue;
  }

  get totalDonated() {
    return (
      (Array.isArray(this._donationCounters) &&
        this._donationCounters.map(dc => ({
          symbol: dc.symbol,
          decimals: dc.decimals,
          amount: dc.totalDonated,
        }))) ||
      []
    );
  }

  get totalDonations() {
    return (
      (Array.isArray(this._donationCounters) &&
        this._donationCounters.reduce((count, dc) => count + dc.donationCount, 0)) ||
      0
    );
  }
}

export default Campaign;
