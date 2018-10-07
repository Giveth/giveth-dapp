import Model from './Model';
import { getTruncatedText } from '../lib/helpers';

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
    if (a.myOrder > b.myOrder) return 1;
    if (a.myOrder < b.myOrder) return -1;
    return 0;
  }

  constructor({
    _id,
    title = '',
    description = '',
    image = '',
    txHash,
    owner,
    reviewer,
    totalDonated = '0',
    currentBalance = '0',
    donationCount = 0,
    peopleCount = 0,
  }) {
    super();

    this.id = _id;
    this.title = title;
    this.description = description;
    this.summary = getTruncatedText(description, 100);
    this.image = image;
    this.newImage = false;
    this.txHash = txHash;
    this.owner = owner || { address: '0x0' }; // FIXME: Check in feathers, owner should be a model
    this.reviewer = reviewer;
    this.totalDonated = totalDonated;
    this.currentBalance = currentBalance;
    this.donationCount = donationCount;
    this.peopleCount = peopleCount;
    this.myOrder = -1;
  }

  get id() {
    return this.myId;
  }

  set id(value) {
    this.checkType(value, ['undefined', 'string'], 'id');
    this.myId = value;
  }

  get title() {
    return this.myTitle;
  }

  set title(value) {
    this.checkType(value, ['string'], 'title');
    this.myTitle = value;
  }

  get description() {
    return this.myDescription;
  }

  set description(value) {
    this.checkType(value, ['string'], 'description');
    this.myDescription = value;
  }

  get summary() {
    return this.mySummary;
  }

  set summary(value) {
    this.checkType(value, ['string'], 'summary');
    this.mySummary = value;
  }

  get image() {
    return this.myImage;
  }

  set image(value) {
    this.checkType(value, ['string'], 'image');
    this.newImage = true;
    this.myImage = value;
  }

  get txHash() {
    return this.myTxHash;
  }

  set txHash(value) {
    this.checkType(value, ['undefined', 'string'], 'txHash');
    this.myTxHash = value;
  }

  get owner() {
    return this.myOwner;
  }

  set owner(value) {
    this.checkType(value, ['undefined', 'object'], 'owner');
    this.myOwner = value;
  }

  get reviewer() {
    return this.myReviewer;
  }

  set reviewer(value) {
    this.checkType(value, ['undefined', 'object'], 'reviewer');
    this.myReviewer = value;
  }

  get totalDonated() {
    return this.myTotalDonated;
  }

  set totalDonated(value) {
    this.checkType(value, ['string'], 'totalDonated');
    this.myTotalDonated = value;
  }

  set currentBalance(value) {
    this.checkType(value, ['string'], 'currentBalance');
    this.myCurrentBalance = value;
  }

  get currentBalance() {
    return this.myCurrentBalance;
  }

  get donationCount() {
    return this.myDonationCount;
  }

  set donationCount(value) {
    this.checkType(value, ['number'], 'donationCount');
    this.myDonationCount = value;
  }

  get peopleCount() {
    return this.myPeopleCount;
  }

  set peopleCount(value) {
    this.checkType(value, ['number'], 'peopleCount');
    this.myPeopleCount = value;
  }
}

export default BasicModel;
