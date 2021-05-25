/* eslint-disable import/no-cycle */
import { toast } from 'react-toastify';
import BasicModel from './BasicModel';
import CommunityService from '../services/CommunityService';
import IPFSService from '../services/IPFSService';
import { cleanIpfsPath } from '../lib/helpers';

/**
 * The DApp Community model
 */
class Community extends BasicModel {
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
    return 'community';
  }

  // eslint-disable-next-line class-methods-use-this
  get type() {
    return Community.type;
  }

  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.delegateId = data.delegateId || 0;
    this.status = data.status || Community.PENDING;
    this.ownerAddress = data.ownerAddress;
    this._id = data._id;
    this.confirmations = data.confirmations || 0;
    this.requiredConfirmations = data.requiredConfirmations;
    this.commitTime = data.commitTime || 0;
    this.slug = data.slug;
    this.campaigns = data.campaigns;
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
    const community = {
      title: this.title,
      slug: this.slug,
      description: this.description,
      communityUrl: this.communityUrl,
      delegateId: this.delegateId,
      image: cleanIpfsPath(this.image),
      totalDonated: this.totalDonated,
      donationCount: this.donationCount,
    };
    if (!this.id) community.txHash = txHash;
    return community;
  }

  save(afterSave, afterMined, onError) {
    if (this.newImage) {
      return IPFSService.upload(this.image)
        .then(hash => {
          // Save the new image address and mark it as old
          this.image = hash;
          this.newImage = false;
        })
        .then(() => CommunityService.save(this, this.owner.address, afterSave, afterMined, onError))
        .catch(_ => toast.error('Cannot connect to IPFS server. Please try again'));
    }
    return CommunityService.save(this, this.owner.address, afterSave, afterMined, onError);
  }

  get communityUrl() {
    return this.myCommunityUrl;
  }

  set communityUrl(value) {
    this.checkType(value, ['string'], 'communityUrl');
    this.myCommunityUrl = value;
  }

  get delegateId() {
    return this.myDelegateId;
  }

  set delegateId(value) {
    this.checkType(value, ['number', 'string'], 'delegateId');
    this.myDelegateId = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['number'], 'commitTime');
    this.myCommitTime = value;
  }

  get status() {
    return this.myStatus;
  }

  set status(value) {
    this.checkValue(value, [Community.PENDING, Community.ACTIVE, Community.CANCELED], 'status');
    this.myStatus = value;
    if (value === Community.PENDING) this.myOrder = 1;
    else if (value === Community.ACTIVE) this.myOrder = 2;
    else if (value === Community.CANCELED) this.myOrder = 3;
    else this.myOrder = 4;
  }

  get isActive() {
    return this.status === Community.ACTIVE;
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

export default Community;
