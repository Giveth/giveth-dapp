/* eslint-disable import/no-cycle */

import BasicModel from './BasicModel';
import CampaignService from '../services/CampaignService';
import IPFSService from '../services/IPFSService';
import ErrorPopup from '../components/ErrorPopup';
import { cleanIpfsPath } from '../lib/helpers';

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
    this.pluginAddress = data.pluginAddress || '0x0000000000000000000000000000000000000000';
    this.status = data.status || Campaign.PENDING;
    this.requiredConfirmations = data.requiredConfirmations;
    this.reviewerAddress = data.reviewerAddress;
    this.ownerAddress = data.ownerAddress;
    this.mined = data.mined;
    this._id = data._id;
    this.commitTime = data.commitTime || 0;
  }

  toIpfs() {
    return {
      title: this.title,
      description: this.description,
      communityUrl: this.communityUrl,
      image: cleanIpfsPath(this.image),
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
      status: this.status,
    };
    if (!this.id) campaign.txHash = txHash;
    return campaign;
  }

  get isActive() {
    return this.status === Campaign.ACTIVE;
  }

  get isPending() {
    return this.status === Campaign.PENDING || !this.mined;
  }

  /**
   * Save the campaign to feathers and blockchain if necessary
   *
   * @param afterSve Callback function once the campaign has been saved to feathers
   * @param afterMined  Callback function once the transaction is mined
   */
  save(afterSave, afterMined) {
    if (this.newImage) {
      IPFSService.upload(this.image)
        .then(hash => {
          // Save the new image address and mark it as old
          this.image = hash;
          this.newImage = false;
        })
        .catch(err => ErrorPopup('Failed to upload image', err))
        .finally(() => CampaignService.save(this, this.owner.address, afterSave, afterMined));
    } else {
      CampaignService.save(this, this.owner.address, afterSave, afterMined);
    }
  }

  /**
   * Cancel the campaign in feathers and blockchain
   *
   * @param from        Either the owner or reviewer. Whoever is canceling the campaign
   * @param afterCreate Callback function once a transaction is created
   * @param afterMined  Callback function once the transaction is mined and feathers updated
   */
  cancel(from, afterCreate, afterMined) {
    CampaignService.cancel(this, from, afterCreate, afterMined);
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
}

export default Campaign;
