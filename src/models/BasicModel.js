import BigNumber from 'bignumber.js';
import { utils } from 'web3';

import Model from './Model';
import { getTruncatedText, ZERO_ADDRESS } from '../lib/helpers';

/**
 * The DAC, Milestone and Campaign base model containing basic common interface
 */
class BasicModel extends Model {
  /**
   * Compares two campaigns
   *
   * @param a First campaign
   * @param b Second campaign
   *
   * @return 1  if a > b
   *         -1 if a < b
   *         0  if a = b
   */
  static compare(a, b) {
    if (a._Order > b._Order) return 1;
    if (a._Order < b._Order) return -1;
    return 0;
  }

  constructor({
    _id,
    title = '',
    description = '',
    image = '',
    txHash,
    owner,
    ownerAddress = ZERO_ADDRESS,
    reviewer,
    url,
    donationCount = 0,
    peopleCount = 0,
    fullyFunded = false,
    donationCounters = [],
    token,
    createdAt,
  }) {
    super();

    this._id = _id;
    this._title = title;
    this._description = description;
    this._summary = getTruncatedText(description, 100);
    this._image = image;
    this._newImage = false;
    this._txHash = txHash;
    this._owner = owner || { address: ownerAddress }; // FIXME: Check in feathers, owner should be a model
    this._ownerAddress = ownerAddress;
    this._reviewer = reviewer;
    this._url = url;
    this._donationCount = donationCount;
    this._peopleCount = peopleCount;
    this._fullyFunded = fullyFunded;
    this._donationCounters = donationCounters.map(c => ({
      ...c,
      totalDonated: new BigNumber(utils.fromWei(c.totalDonated)),
      currentBalance: new BigNumber(utils.fromWei(c.currentBalance)),
    }));
    this._Order = -1;
    this._token = token;
    this._createdAt = createdAt;
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this.checkType(value, ['undefined', 'string'], 'id');
    this._id = value;
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this.checkType(value, ['string'], 'title');
    this._title = value;
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this.checkType(value, ['string'], 'description');
    this._description = value;
  }

  get summary() {
    return this._summary;
  }

  set summary(value) {
    this.checkType(value, ['string'], 'summary');
    this._summary = value;
  }

  get image() {
    return this._image;
  }

  set image(value) {
    this.checkType(value, ['string'], 'image');
    this.newImage = true;
    this._image = value;
  }

  get txHash() {
    return this._txHash;
  }

  set txHash(value) {
    this.checkType(value, ['undefined', 'string'], 'txHash');
    this._txHash = value;
  }

  get owner() {
    return this._owner;
  }

  set owner(value) {
    this.checkType(value, ['undefined', 'object'], 'owner');
    this._owner = value;
    this._ownerAddress = value.address;
  }

  get ownerAddress() {
    return this._ownerAddress;
  }

  set ownerAddress(value) {
    this.checkType(value, ['undefined', 'string'], 'ownerAddress');
    this._ownerAddress = value;
  }

  get reviewer() {
    return this._reviewer;
  }

  set reviewer(value) {
    this.checkType(value, ['undefined', 'object'], 'reviewer');
    this._reviewer = value;
  }

  get url() {
    return this._url;
  }

  set url(value) {
    this.checkType(value, ['undefined', 'string'], 'url');
    this._url = value;
  }

  get totalDonationCount() {
    return this._donationCounters.reduce(
      (count, token) => count.plus(token.donationCount),
      new BigNumber('0'),
    );
  }

  get peopleCount() {
    return this._peopleCount;
  }

  set peopleCount(value) {
    this.checkType(value, ['number'], 'peopleCount');
    this._peopleCount = value;
  }

  get fullyFunded() {
    return this._fullyFunded;
  }

  set fullyFunded(value) {
    this.checkType(value, ['boolean'], 'fullyFunded');
    this._fullyFunded = value;
  }

  get donationCounters() {
    return this._donationCounters;
  }

  set donationCounters(value) {
    this._donationCounters = value;
  }

  get token() {
    return this._token;
  }

  set token(value) {
    this._token = value;
  }

  get createdAt() {
    return this._createdAt;
  }
}

export default BasicModel;
