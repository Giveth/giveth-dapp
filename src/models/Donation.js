import Model from './Model';
import { getTruncatedText } from '../lib/helpers';
// import User from './User';

/* eslint no-underscore-dangle: 0 */

/**
 * The DApp donation model
 */
class Donation extends Model {
  static get PENDING() {
    return 'pending';
  }
  static get TO_APPROVE() {
    return 'to_approve';
  }
  static get WAITING() {
    return 'waiting';
  }
  static get COMMITTED() {
    return 'committed';
  }
  static get PAYING() {
    return 'paying';
  }
  static get PAID() {
    return 'paid';
  }
  static get CANCELED() {
    return 'cancelled';
  }

  constructor(data) {
    super(data);

    this.id = data._id;
    this.amount = data.amount;
    this.commitTime = data.commitTime;
    this.confirmations = data.confirmations || 0;
    this.createdAt = data.createdAt;
    this.delegate = data.delegate;
    this.delegateEntity = data.delegateEntity;
    this.delegateId = data.delegateId;
    this.giver = data.giver;
    this.giverAddress = data.giverAddress;
    this.intendedProject = data.intendedProject;
    this.owner = data.owner;
    this.ownerEntity = data.ownerEntity;
    this.ownerId = data.ownerId;
    this.ownerType = data.ownerType;
    this.paymentStatus = data.paymentStatus;
    this.pledgeId = data.pledgeId;
    this.requiredConfirmations = data.requiredConfirmations;
    this.status = data.status;
    this.txHash = data.txHash;
    this.updatedAt = data.updatedAt;

    /**
     * Get the URL, name and type of the entity to which this donation has been donated to
     *
     * URL {string}  URL to the entity
     * name {string} Title of the entity
     * type {string} Type of the entity - one of DAC, CAMPAIGN, MILESTONE or GIVER
     */
    const donatedTo = {
      url: '/',
      name: '',
      type: '',
    };
    if (this.delegate > 0) {
      // DAC
      donatedTo.url = `/dacs/${this.delegateEntity._id}`; // eslint-disable-line no-underscore-dangle
      donatedTo.name = getTruncatedText(this.delegateEntity.title, 45);
      donatedTo.type = 'DAC';
    } else if (!this.delegate && this.ownerType === 'campaign') {
      // Campaing
      donatedTo.url = `/${this.ownerType}s/${this.ownerEntity._id}`; // eslint-disable-line no-underscore-dangle
      donatedTo.name = getTruncatedText(this.ownerEntity.title, 45);
      donatedTo.type = 'CAMPAIGN';
    } else if (!this.delegate && this.ownerType === 'milestone') {
      // Milestone
      donatedTo.url = `/campaigns/${this.ownerEntity.campaign._id}/milestones/${
        this.ownerEntity._id
      }`; // eslint-disable-line no-underscore-dangle
      donatedTo.name = getTruncatedText(this.ownerEntity.title, 45);
      donatedTo.type = 'MILESTONE';
    } else {
      // User
      donatedTo.url = `/profile/${this.ownerEntity.address}`;
      donatedTo.name = this.ownerEntity.name || this.ownerEntity.address;
      donatedTo.type = 'GIVER';
    }
    this.myDonatedTo = donatedTo;
  }

  get statusDescription() {
    switch (this.status) {
      case Donation.PENDING:
        return 'pending successful transaction';
      case Donation.TO_APPROVE:
        return 'pending for your approval to be committed.';
      case Donation.WAITING:
        return 'waiting for further delegation';
      case Donation.COMMITTED:
        return 'committed';
      case Donation.PAYING:
        return 'paying';
      case Donation.PAID:
        return 'paid';
      case Donation.CANCELED:
        return 'cancelled';
      default:
        return 'unknown';
    }
  }

  // toFeathers() {
  //   return {};
  // }

  /**
   * Get the URL, name and type of the entity to which this donation has been donated to
   *
   * @returns {Object}
   *                     URL {string}  URL to the entity
   *                     name {string} Title of the entity
   *                     type {string} Type of the entity - one of DAC, CAMPAIGN, MILESTONE or GIVER
   */
  get donatedTo() {
    return this.myDonatedTo;
  }

  get id() {
    return this.myId;
  }

  set id(value) {
    this.checkType(value, ['string'], 'id');
    this.myId = value;
  }

  get amount() {
    return this.myAmount;
  }

  set amount(value) {
    this.checkType(value, ['string'], 'amount');
    this.myAmount = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['string', 'undefined'], 'commitTime');
    this.myCommitTime = value;
  }

  get confirmations() {
    return this.myConfirmations;
  }

  set confirmations(value) {
    this.checkType(value, ['number'], 'confirmations');
    this.myConfirmations = value;
  }

  get createdAt() {
    return this.myCreatedAt;
  }

  set createdAt(value) {
    this.checkType(value, ['string'], 'createdAt');
    this.myCreatedAt = value;
  }

  get delegate() {
    return this.myDelegate;
  }

  set delegate(value) {
    this.checkType(value, ['string', 'undefined'], 'delegate');
    this.myDelegate = value;
  }

  get delegateEntity() {
    return this.myDelegateEntity;
  }

  set delegateEntity(value) {
    this.checkType(value, ['object', 'undefined'], 'delegateEntity');
    this.myDelegateEntity = value;
  }

  get delegateId() {
    return this.myDelegateId;
  }

  set delegateId(value) {
    this.checkType(value, ['string', 'undefined'], 'delegateId');
    this.myDelegateId = value;
  }

  get giver() {
    return this.myGiver;
  }

  set giver(value) {
    this.checkType(value, ['object', 'undefined'], 'giver');
    this.myGiver = value;
  }

  get giverAddress() {
    return this.myGiverAddress;
  }

  set giverAddress(value) {
    this.checkType(value, ['string'], 'giverAddress');
    this.myGiverAddress = value;
  }

  get intendedProject() {
    return this.myIntendedProject;
  }

  set intendedProject(value) {
    this.checkType(value, ['string', 'undefined'], 'intendedProject');
    this.myIntendedProject = value;
  }

  get owner() {
    return this.myOwner;
  }

  set owner(value) {
    this.checkType(value, ['string'], 'owner');
    this.myOwner = value;
  }

  get ownerEntity() {
    return this.myOwnerEntity;
  }

  set ownerEntity(value) {
    this.checkType(value, ['object'], 'ownerEntity');
    this.myOwnerEntity = value;
  }

  get ownerId() {
    return this.myOwnerId;
  }

  set ownerId(value) {
    this.checkType(value, ['string'], 'ownerEntity');
    this.myOwnerId = value;
  }

  get ownerType() {
    return this.myOwnerType;
  }

  set ownerType(value) {
    this.checkType(value, ['string'], 'ownerType');
    this.myOwnerType = value;
  }

  get paymentStatus() {
    return this.myPaymentStatus;
  }

  set paymentStatus(value) {
    this.checkType(value, ['string'], 'paymentStatus');
    this.myPaymentStatus = value;
  }

  get pledgeId() {
    return this.myPledgeId;
  }

  set pledgeId(value) {
    this.checkType(value, ['string'], 'pledgeId');
    this.myPledgeId = value;
  }

  get requiredConfirmations() {
    return this.myRequiredConfirmations;
  }

  set requiredConfirmations(value) {
    this.checkType(value, ['number'], 'requiredConfirmations');
    this.myRequiredConfirmations = value;
  }

  get status() {
    return this.myStatus;
  }

  set status(value) {
    this.checkValue(
      value,
      [
        Donation.PENDING,
        Donation.TO_APPROVE,
        Donation.WAITING,
        Donation.COMMITTED,
        Donation.PAYING,
        Donation.PAID,
        Donation.CANCELED,
      ],
      'status',
    );
    this.myStatus = value;
  }

  get txHash() {
    return this.myTxHash;
  }

  set txHash(value) {
    this.checkType(value, ['string'], 'txHash');
    this.myTxHash = value;
  }

  get updatedAt() {
    return this.myUpdatedAt;
  }

  set updatedAt(value) {
    this.checkType(value, ['string', 'undefined'], 'updatedAt');
    this.myUpdatedAt = value;
  }
}

export default Donation;
