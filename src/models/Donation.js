import Model from './Model';

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
    this.confirmations = data.confirmations;
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
