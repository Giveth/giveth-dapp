import Model from './Model';
import { getTruncatedText } from '../lib/helpers';
import Milestone from './Milestone';
import Campaign from './Campaign';
// import User from './User';

/* eslint no-underscore-dangle: 0 */

/**
 * The DApp donation model
 */
class Donation extends Model {
  static get PENDING() {
    return 'Pending';
  }

  static get TO_APPROVE() {
    return 'ToApprove';
  }

  static get WAITING() {
    return 'Waiting';
  }

  static get COMMITTED() {
    return 'Committed';
  }

  static get PAYING() {
    return 'Paying';
  }

  static get PAID() {
    return 'Paid';
  }

  static get CANCELED() {
    return 'Canceled';
  }

  static get REJECTED() {
    return 'Rejected';
  }

  static get statuses() {
    return [
      Donation.PENDING,
      Donation.PAYING,
      Donation.PAID,
      Donation.TO_APPROVE,
      Donation.WAITING,
      Donation.COMMITTED,
      Donation.CANCELED,
      Donation.REJECTED,
    ];
  }

  constructor(data) {
    super(data);

    this.id = data._id;
    this.amount = data.amount;
    this.amountRemaining = data.amountRemaining;
    this.myPendingAmountRemaining = data.pendingAmountRemaining;
    this.commitTime = data.commitTime;
    this.confirmations = data.confirmations || 0;
    this.createdAt = data.createdAt;
    this.delegateId = data.delegateId;
    this.delegateEntity = data.delegateEntity;
    this.delegateTypeId = data.delegateTypeId;
    this.giver = data.giver;
    this.giverAddress = data.giverAddress;
    this.intendedProjectId = data.intendedProjectId;
    this.intendedProjectTypeId = data.intendedProjectTypeId;
    this.intendedProjectType = data.intendedProjectType;
    this.intendedProjectEntity = data.intendedProjectEntity;
    this.ownerId = data.ownerId;
    this.ownerEntity = data.ownerEntity;
    this.ownerTypeId = data.ownerTypeId;
    this.ownerType = data.ownerType;
    this.pledgeId = data.pledgeId;
    this.canceledPledgeId = data.canceledPledgeId;
    this.requiredConfirmations = data.requiredConfirmations;
    this.status = data.status;
    this.mined = data.mined;
    this.txHash = data.txHash;
    this.updatedAt = data.updatedAt;
    this.isReturn = data.isReturn;

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
    if (this.delegateId > 0 && !this.intendedProjectId) {
      // DAC
      donatedTo.url = `/dacs/${this.delegateEntity._id}`;
      donatedTo.name = getTruncatedText(this.delegateEntity.title, 45);
      donatedTo.type = 'DAC';
    } else if (
      (!this.delegateId && this.ownerType === Campaign.type) ||
      (this.intendedProjectId && this.intendedProjectType === Campaign.type)
    ) {
      // Campaign
      const entity = this.intendedProjectId ? this.intendedProjectEntity : this.ownerEntity;
      donatedTo.url = `/campaigns/${entity._id}`;
      donatedTo.name = getTruncatedText(entity.title, 45);
      donatedTo.type = 'CAMPAIGN';
    } else if (
      (!this.delegateId && this.ownerType === Milestone.type) ||
      (this.intendedProjectId && this.intendedProjectType === Milestone.type)
    ) {
      // Milestone
      const entity = this.intendedProjectId ? this.intendedProjectEntity : this.ownerEntity;
      donatedTo.url = `/campaigns/${entity.campaign._id}/milestones/${entity._id}`;
      donatedTo.name = getTruncatedText(entity.title, 45);
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
        return 'canceled';
      case Donation.REJECTED:
        return 'rejected';
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

  /**
   * Check if a user can refund this donation
   *
   * @param {User} user User for whom the action should be checked
   *
   * @return {boolean} True if given user can refund the donation
   */
  canRefund(user) {
    return (
      this.ownerTypeId === user.address &&
      this.status === Donation.WAITING &&
      this.amountRemaining > 0
    );
  }

  /**
   * Check if a user can approve or reject delegation of this donation
   *
   * @param {User} user User for whom the action should be checked
   *
   * @return {boolean} True if given user can approve or reject the delegation of the donation
   */
  canApproveReject(user) {
    return (
      this.ownerTypeId === user.address &&
      this.status === Donation.TO_APPROVE &&
      new Date() < new Date(this.commitTime)
    );
  }

  /**
   * Check if a user can delegate this donation
   *
   * @param {User} user User for whom the action should be checked
   *
   * @return {boolean} True if given user can delegate the donation
   */
  canDelegate(user) {
    return this.status === Donation.WAITING && this.ownerEntity.address === user.address;
  }

  get isPending() {
    return (
      this.status === Donation.PENDING || this.myPendingAmountRemaining !== undefined || !this.mined
    );
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

  get amountRemaining() {
    return this.myPendingAmountRemaining || this.myAmountRemaining;
  }

  set amountRemaining(value) {
    this.checkType(value, ['string'], 'amountRemaining');
    this.myAmountRemaining = value;
  }

  set pendingAmountRemaining(value) {
    this.checkType(value, ['string', 'undefined'], 'pendingAmountRemaining');
    if (this.myPendingAmountRemaining) {
      throw new Error('not allowed to set pendingAmountRemaining');
    }
    this.pendingAmountRemaining = value;
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

  get delegateId() {
    return this.myDelegateId;
  }

  set delegateId(value) {
    this.checkType(value, ['number', 'string', 'undefined'], 'delegateId');
    this.myDelegateId = value;
  }

  get delegateEntity() {
    return this.myDelegateEntity;
  }

  set delegateEntity(value) {
    this.checkType(value, ['object', 'undefined'], 'delegateEntity');
    this.myDelegateEntity = value;
  }

  get delegateTypeId() {
    return this.myDelegateTypeId;
  }

  set delegateTypeId(value) {
    this.checkType(value, ['string', 'undefined'], 'delegateTypeId');
    this.myDelegateTypeId = value;
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

  get intendedProjectId() {
    return this.myIntendedProjectId;
  }

  set intendedProjectId(value) {
    this.checkType(value, ['number', 'string', 'undefined'], 'intendedProjectId');
    this.myIntendedProjectId = value;
  }

  get intendedProjectTypeId() {
    return this.myIntendedProjectTypeId;
  }

  set intendedProjectTypeId(value) {
    this.checkType(value, ['number', 'string', 'undefined'], 'intendedProjectTypeId');
    this.myIntendedProjectTypeId = value;
  }

  get intendedProjectType() {
    return this.myIntendedProjectType;
  }

  set intendedProjectType(value) {
    this.checkType(value, ['string', 'undefined'], 'intendedProjectType');
    this.myIntendedProjectType = value;
  }

  get intendedProjectEntity() {
    return this.myIntendedProjectEntity;
  }

  set intendedProjectEntity(value) {
    this.checkType(value, ['object', 'undefined'], 'intendedProjectEntity');
    this.myIntendedProjectEntity = value;
  }

  get ownerId() {
    return this.myOwnerId;
  }

  set ownerId(value) {
    this.checkType(value, ['number', 'string'], 'ownerId');
    this.myOwnerId = value;
  }

  get ownerEntity() {
    return this.myOwnerEntity;
  }

  set ownerEntity(value) {
    this.checkType(value, ['object'], 'ownerEntity');
    this.myOwnerEntity = value;
  }

  get ownerTypeId() {
    return this.myOwnerTypeId;
  }

  set ownerTypeId(value) {
    this.checkType(value, ['string'], 'ownerEntity');
    this.myOwnerTypeId = value;
  }

  get ownerType() {
    return this.myOwnerType;
  }

  set ownerType(value) {
    this.checkType(value, ['string'], 'ownerType');
    this.myOwnerType = value;
  }

  get pledgeId() {
    return this.myCanceledPledgeId > 0 ? this.myCanceledPledgeId : this.myPledgeId;
  }

  set pledgeId(value) {
    this.checkType(value, ['string'], 'pledgeId');
    if (this.myPledgeId) {
      throw new Error('not allowed to set pledgeId');
    }
    this.myPledgeId = value;
  }

  set canceledPledgeId(value) {
    this.checkType(value, ['string', 'undefined'], 'canceledPledgeId');
    if (this.myCanceledPledgeId) {
      throw new Error('not allowed to set canceledPledgeId');
    }
    this.myCanceledPledgeId = value;
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
    this.checkValue(value, Donation.statuses, 'status');
    this.myStatus = value;
  }

  get txHash() {
    return this.myTxHash;
  }

  set txHash(value) {
    this.checkType(value, ['string', 'undefined'], 'txHash');
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
