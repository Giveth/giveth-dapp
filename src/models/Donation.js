import BigNumber from 'bignumber.js';
import { utils } from 'web3';

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

  static get FAILED() {
    return 'Failed';
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
      Donation.FAILED,
    ];
  }

  constructor(data) {
    super(data);

    this._id = data._id;
    this._amount = new BigNumber(utils.fromWei(data.amount));
    this._amountRemaining = new BigNumber(
      utils.fromWei(data.amountRemaining ? data.amountRemaining : data.amount),
    ); // use amount as amount remaining when absent
    this._pendingAmountRemaining = data.pendingAmountRemaining
      ? new BigNumber(utils.fromWei(data.pendingAmountRemaining))
      : undefined;
    this._commitTime = data.commitTime;
    this._confirmations = data.confirmations || 0;
    this._createdAt = data.createdAt;
    this._delegateId = data.delegateId;
    this._delegateType = data.delegateType;
    this._delegateEntity = data.delegateEntity;
    this._delegateTypeId = data.delegateTypeId;
    this._giver = data.giver;
    this._giverAddress = data.giverAddress;
    this._intendedProjectId = data.intendedProjectId;
    this._intendedProjectTypeId = data.intendedProjectTypeId;
    this._intendedProjectType = data.intendedProjectType;
    this._intendedProjectEntity = data.intendedProjectEntity;
    this._ownerId = data.ownerId;
    this._ownerEntity = data.ownerEntity;
    this._ownerTypeId = data.ownerTypeId;
    this._ownerType = data.ownerType;
    this._pledgeId = data.pledgeId;
    this._canceledPledgeId = data.canceledPledgeId;
    this._requiredConfirmations = data.requiredConfirmations;
    this._status = data.status;
    this._mined = data.mined;
    this._txHash = data.txHash;
    this._updatedAt = data.updatedAt;
    this._isReturn = data.isReturn;
    this._token = data.token;
    this._usdValue = data.usdValue;
    this._parentDonations = data.parentDonations;

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
    if (this._delegateId > 0 && !this._intendedProjectId) {
      // DAC
      donatedTo.url = `/dacs/${this._delegateEntity._id}`;
      donatedTo.name = getTruncatedText(this._delegateEntity.title, 45);
      donatedTo.type = 'DAC';
    } else if (
      (!this._delegateId && this._ownerType === Campaign.type) ||
      (this._intendedProjectId && this._intendedProjectType === Campaign.type)
    ) {
      // Campaign
      const entity = this._intendedProjectId ? this._intendedProjectEntity : this._ownerEntity;
      donatedTo.url = entity !== undefined ? `/campaigns/${entity._id}` : null;
      donatedTo.name = entity !== undefined ? getTruncatedText(entity.title, 45) : null;
      donatedTo.type = 'CAMPAIGN';
    } else if (
      (!this._delegateId && this._ownerType === Milestone.type) ||
      (this._intendedProjectId && this._intendedProjectType === Milestone.type)
    ) {
      // Milestone
      const entity = this._intendedProjectId ? this._intendedProjectEntity : this._ownerEntity;
      donatedTo.url =
        entity !== undefined ? `/campaigns/${entity.campaign._id}/milestones/${entity._id}` : null;
      donatedTo.name = entity !== undefined ? getTruncatedText(entity.title, 45) : null;
      donatedTo.type = 'MILESTONE';
    } else {
      // User
      donatedTo.url = `/profile/${this._ownerEntity.address}`;
      donatedTo.name = this._ownerEntity.name || this._ownerEntity.address;
      donatedTo.type = 'GIVER';
    }
    this._donatedTo = donatedTo;
  }

  get statusDescription() {
    switch (this._status) {
      case Donation.PENDING:
        return 'pending successful transaction';
      case Donation.TO_APPROVE:
        return 'proposed delegation';
      case Donation.WAITING:
        return 'ready for delegation';
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
      case Donation.FAILED:
        return 'failed';
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
    return this._donatedTo;
  }

  /**
   * Check if a user can refund this donation
   *
   * @param {User} user User for whom the action should be checked
   * @param {boolean} isForeignNetwork Are we connected to the foreign network
   *
   * @return {boolean} True if given user can refund the donation
   */
  canRefund(user, isForeignNetwork) {
    return (
      isForeignNetwork &&
      ((this._ownerTypeId === user.address && this._status === Donation.WAITING) ||
        this._status === Donation.CANCELED) &&
      this._amountRemaining.toNumber() > 0
    );
  }

  /**
   * Check if a user can approve or reject delegation of this donation
   *
   * @param {User} user User for whom the action should be checked
   * @param {boolean} isForeignNetwork Are we connected to the foreign network
   *
   * @return {boolean} True if given user can approve or reject the delegation of the donation
   */
  canApproveReject(user, isForeignNetwork) {
    return (
      isForeignNetwork &&
      this._ownerTypeId === user.address &&
      this._status === Donation.TO_APPROVE &&
      this._mined === true &&
      (new Date() < new Date(this._commitTime) || !this._commitTime)
    );
  }

  /**
   * Check if a user can delegate this donation
   *
   * @param {User}    user User for whom the action should be checked
   * @param {boolean} isForeignNetwork Are we connected to the foreign network
   *
   * @return {boolean} True if given user can delegate the donation
   */
  canDelegate(user, isForeignNetwork) {
    return (
      isForeignNetwork &&
      this._status === Donation.WAITING &&
      this._ownerEntity.address === user.address
    );
  }

  get isPending() {
    return this._status === Donation.PENDING || this._pendingAmountRemaining || !this._mined;
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this.checkType(value, ['string'], 'id');
    this._id = value;
  }

  get amount() {
    return this._amount;
  }

  set amount(value) {
    this.checkType(value, ['string'], 'amount');
    this._amount = value;
  }

  get amountRemaining() {
    return this._pendingAmountRemaining || this._amountRemaining;
  }

  set amountRemaining(value) {
    this.checkInstanceOf(value, BigNumber, 'amountRemaining');
    this._amountRemaining = value;
  }

  set pendingAmountRemaining(value) {
    this.checkInstanceOf(value, BigNumber, 'pendingAmountRemaining');
    if (this._pendingAmountRemaining) {
      throw new Error('not allowed to set pendingAmountRemaining');
    }
    this._pendingAmountRemaining = value;
  }

  get commitTime() {
    return this._commitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['string', 'undefined'], 'commitTime');
    this._commitTime = value;
  }

  get confirmations() {
    return this._confirmations;
  }

  set confirmations(value) {
    this.checkType(value, ['number'], 'confirmations');
    this._confirmations = value;
  }

  get createdAt() {
    return this._createdAt;
  }

  set createdAt(value) {
    this.checkType(value, ['string'], 'createdAt');
    this._createdAt = value;
  }

  get delegateId() {
    return this._delegateId;
  }

  set delegateId(value) {
    this.checkType(value, ['number', 'string', 'undefined'], 'delegateId');
    this._delegateId = value;
  }

  get delegateEntity() {
    return this._delegateEntity;
  }

  set delegateEntity(value) {
    this.checkType(value, ['object', 'undefined'], 'delegateEntity');
    this._delegateEntity = value;
  }

  get delegateTypeId() {
    return this._delegateTypeId;
  }

  set delegateTypeId(value) {
    this.checkType(value, ['string', 'undefined'], 'delegateTypeId');
    this._delegateTypeId = value;
  }

  get giver() {
    return this._giver;
  }

  set giver(value) {
    this.checkType(value, ['object', 'undefined'], 'giver');
    this._giver = value;
  }

  get giverAddress() {
    return this._giverAddress;
  }

  set giverAddress(value) {
    this.checkType(value, ['string'], 'giverAddress');
    this._giverAddress = value;
  }

  get intendedProjectId() {
    return this._intendedProjectId;
  }

  set intendedProjectId(value) {
    this.checkType(value, ['number', 'string', 'undefined'], 'intendedProjectId');
    this._intendedProjectId = value;
  }

  get intendedProjectTypeId() {
    return this._intendedProjectTypeId;
  }

  set intendedProjectTypeId(value) {
    this.checkType(value, ['number', 'string', 'undefined'], 'intendedProjectTypeId');
    this._intendedProjectTypeId = value;
  }

  get intendedProjectType() {
    return this._intendedProjectType;
  }

  set intendedProjectType(value) {
    this.checkType(value, ['string', 'undefined'], 'intendedProjectType');
    this._intendedProjectType = value;
  }

  get intendedProjectEntity() {
    return this._intendedProjectEntity;
  }

  set intendedProjectEntity(value) {
    this.checkType(value, ['object', 'undefined'], 'intendedProjectEntity');
    this._intendedProjectEntity = value;
  }

  get ownerId() {
    return this._ownerId;
  }

  set ownerId(value) {
    this.checkType(value, ['number', 'string'], 'ownerId');
    this._ownerId = value;
  }

  get ownerEntity() {
    return this._ownerEntity;
  }

  set ownerEntity(value) {
    this.checkType(value, ['undefined', 'object'], 'ownerEntity');
    this._ownerEntity = value;
  }

  get ownerTypeId() {
    return this._ownerTypeId;
  }

  set ownerTypeId(value) {
    this.checkType(value, ['string'], 'ownerEntity');
    this._ownerTypeId = value;
  }

  get ownerType() {
    return this._ownerType;
  }

  set ownerType(value) {
    this.checkType(value, ['string'], 'ownerType');
    this._ownerType = value;
  }

  get pledgeId() {
    return this._canceledPledgeId > 0 ? this._canceledPledgeId : this._pledgeId;
  }

  set pledgeId(value) {
    this.checkType(value, ['string'], 'pledgeId');
    if (this._pledgeId) {
      throw new Error('not allowed to set pledgeId');
    }
    this._pledgeId = value;
  }

  set canceledPledgeId(value) {
    this.checkType(value, ['string', 'undefined'], 'canceledPledgeId');
    if (this._canceledPledgeId) {
      throw new Error('not allowed to set canceledPledgeId');
    }
    this._canceledPledgeId = value;
  }

  get requiredConfirmations() {
    return this._requiredConfirmations;
  }

  set requiredConfirmations(value) {
    this.checkType(value, ['number'], 'requiredConfirmations');
    this._requiredConfirmations = value;
  }

  get status() {
    return this._status;
  }

  set status(value) {
    this.checkValue(value, Donation.statuses, 'status');
    this._status = value;
  }

  get txHash() {
    return this._txHash;
  }

  set txHash(value) {
    this.checkType(value, ['string', 'undefined'], 'txHash');
    this._txHash = value;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  set updatedAt(value) {
    this.checkType(value, ['string', 'undefined'], 'updatedAt');
    this._updatedAt = value;
  }

  get token() {
    return this._token;
  }

  set token(value) {
    this._token = value;
  }

  get usdValue() {
    return this._usdValue;
  }

  get parentDonations() {
    return this._parentDonations;
  }
}

export default Donation;
