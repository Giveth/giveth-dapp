/* eslint-disable import/no-cycle */
import { toast } from 'react-toastify';
import BasicModel from './BasicModel';
import DACService from '../services/DACService';
import IPFSService from '../services/IPFSService';
import { cleanIpfsPath } from '../lib/helpers';

/**
 * The DApp DAC model
 */
class DAC extends BasicModel {
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
    return 'dac';
  }

  // eslint-disable-next-line class-methods-use-this
  get type() {
    return DAC.type;
  }

  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.delegateId = data.delegateId || 0;
    this.status = data.status || DAC.PENDING;
    this.ownerAddress = data.ownerAddress;
    this._id = data._id;
    this.confirmations = data.confirmations || 0;
    this.requiredConfirmations = data.requiredConfirmations;
    this.commitTime = data.commitTime || 0;
    this.slug = data.slug;
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
    const dac = {
      title: this.title,
      slug: this.slug,
      description: this.description,
      communityUrl: this.communityUrl,
      delegateId: this.delegateId,
      image: cleanIpfsPath(this.image),
      totalDonated: this.totalDonated,
      donationCount: this.donationCount,
    };
    if (!this.id) dac.txHash = txHash;
    return dac;
  }

  save(afterSave, afterMined, onError) {
    if (this.newImage) {
      return IPFSService.upload(this.image)
        .then(hash => {
          // Save the new image address and mark it as old
          this.image = hash;
          this.newImage = false;
        })
        .then(() => DACService.save(this, this.owner.address, afterSave, afterMined, onError))
        .catch(_ => toast.error('Cannot connect to IPFS server. Please try again'));
    }
    return DACService.save(this, this.owner.address, afterSave, afterMined, onError);
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
    this.checkValue(value, [DAC.PENDING, DAC.ACTIVE, DAC.CANCELED], 'status');
    this.myStatus = value;
    if (value === DAC.PENDING) this.myOrder = 1;
    else if (value === DAC.ACTIVE) this.myOrder = 2;
    else if (value === DAC.CANCELED) this.myOrder = 3;
    else this.myOrder = 4;
  }

  get isActive() {
    return this.status === DAC.ACTIVE;
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

export default DAC;
