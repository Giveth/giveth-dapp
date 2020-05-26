import BigNumber from 'bignumber.js';
import { utils } from 'web3';

import { getStartOfDayUTC, cleanIpfsPath, ZERO_ADDRESS, ANY_TOKEN } from '../lib/helpers';
import BasicModel from './BasicModel';
import MilestoneItemModel from './MilestoneItem';

/**
 * The DApp Milestone model
 */
export default class Milestone extends BasicModel {
  constructor(data) {
    super(data);

    const {
      id = data._id || undefined,
      maxAmount = undefined,
      selectedFiatType,
      fiatAmount,
      recipientAddress = '',
      pendingRecipientAddress,
      status = Milestone.PENDING,
      projectId = undefined,
      ownerAddress = '',
      reviewerAddress = '',
      dacId = 0,
      items = [],
      date = getStartOfDayUTC().subtract(1, 'd'),
      confirmations = 0,
      requiredConfirmations = 6,
      commitTime,
      campaignId,
      token,

      // transient
      campaign,
      owner,
      coowner,
      recipient,
      pendingRecipient,
      reviewer,
      mined = false,
      pluginAddress = ZERO_ADDRESS,
      conversionRateTimestamp,
    } = data;

    this._selectedFiatType = selectedFiatType;
    this._maxAmount = maxAmount ? new BigNumber(utils.fromWei(maxAmount)) : undefined;
    this._fiatAmount = fiatAmount ? new BigNumber(fiatAmount) : new BigNumber(0);
    this._ownerAddress = ownerAddress;
    this._recipientAddress = recipientAddress;
    this._pendingRecipientAddress = pendingRecipientAddress;
    this._status = status;
    this._projectId = projectId;
    this._reviewerAddress = reviewerAddress;
    this._dacId = dacId;
    this._items = items.map(i => new MilestoneItemModel(i));
    this._itemizeState = items && items.length > 0;
    this._date = getStartOfDayUTC(date);
    this._id = id;
    this._confirmations = confirmations;
    this._requiredConfirmations = requiredConfirmations;
    this._commitTime = commitTime;
    this._pluginAddress = pluginAddress;
    this._token = token;
    this._conversionRateTimestamp = conversionRateTimestamp;

    // transient
    this._campaign = campaign;
    this._owner = owner;
    this._coowner = coowner;
    this._recipient = recipient;
    this._pendingRecipient = pendingRecipient;
    this._reviewer = reviewer;
    this._mined = mined;
    this._campaignId = campaignId;
  }

  toIpfs() {
    const data = {
      title: this._title,
      description: this._description,
      image: cleanIpfsPath(this._image),
      items: this._items.map(i => i.toIpfs()),
      date: this._date,
      isArchived: this.isArchived,
      version: 1,
    };
    if (this.isCapped) {
      Object.assign(data, {
        conversionRateTimestamp: this._conversionRateTimestamp,
        selectedFiatType: this._selectedFiatType,
        fiatAmount: this._fiatAmount.toString(),
        conversionRate: this._conversionRate,
      });
    }

    return data;
  }

  toFeathers(txHash) {
    const milestone = {
      title: this._title,
      description: this._description,
      image: cleanIpfsPath(this._image),
      ownerAddress: this._ownerAddress,
      reviewerAddress: this._reviewerAddress,
      dacId: this._dacId,
      recipientAddress: this._recipientAddress,
      campaignId: this._campaignId,
      projectId: this._projectId,
      status: this._status,
      items: this._items.map(i => i.toFeathers()),
      date: this._date,
      pluginAddress: this._pluginAddress,
      token: this._token,
      type: this.milestoneType,
    };
    if (this.isCapped) {
      Object.assign(milestone, {
        maxAmount: utils.toWei(this.maxAmount.toFixed()),
        conversionRateTimestamp: this._conversionRateTimestamp,
        selectedFiatType: this._selectedFiatType,
        fiatAmount: this._fiatAmount.toString(),
        conversionRate: this._conversionRate,
      });
    }
    if (!this.id) milestone.txHash = txHash;

    return milestone;
  }

  /**
    get & setters
  * */

  static get PROPOSED() {
    return Milestone.statuses.PROPOSED;
  }

  static get REJECTED() {
    return Milestone.statuses.REJECTED;
  }

  static get PENDING() {
    return Milestone.statuses.PENDING;
  }

  static get IN_PROGRESS() {
    return Milestone.statuses.IN_PROGRESS;
  }

  static get NEEDS_REVIEW() {
    return Milestone.statuses.NEEDS_REVIEW;
  }

  static get COMPLETED() {
    return Milestone.statuses.COMPLETED;
  }

  static get CANCELED() {
    return Milestone.statuses.CANCELED;
  }

  static get PAYING() {
    return Milestone.statuses.PAYING;
  }

  static get PAID() {
    return Milestone.statuses.PAID;
  }

  static get FAILED() {
    return Milestone.statuses.FAILED;
  }

  static get ARCHIVED() {
    return Milestone.statuses.ARCHIVED;
  }

  static get statuses() {
    return {
      PROPOSED: 'Proposed',
      REJECTED: 'Rejected',
      PENDING: 'Pending',
      IN_PROGRESS: 'InProgress',
      NEEDS_REVIEW: 'NeedsReview',
      COMPLETED: 'Completed',
      CANCELED: 'Canceled',
      PAYING: 'Paying',
      PAID: 'Paid',
      FAILED: 'Failed',
      ARCHIVED: 'Archived',
    };
  }

  static get type() {
    return 'milestone';
  }

  // eslint-disable-next-line class-methods-use-this
  get type() {
    return Milestone.type;
  }

  // eslint-disable-next-line class-methods-use-this
  get milestoneType() {
    throw new Error('type is not implemented');
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this.checkType(value, ['string'], 'title');
    this._title = value;
  }

  get id() {
    return this._id;
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this.checkType(value, ['string'], 'description');
    this._description = value;
  }

  get image() {
    return this._image;
  }

  set image(value) {
    this.checkType(value, ['string'], 'image');
    this._image = value;
  }

  get maxAmount() {
    // max amount is not stored in wei
    if (this.itemizeState) {
      return this.items.reduce(
        (accumulator, item) => accumulator.plus(new BigNumber(utils.fromWei(item.wei))),
        new BigNumber(0),
      );
    }

    return this._maxAmount;
  }

  set maxAmount(value) {
    if (value === undefined) {
      this._maxAmount = value;
      return;
    }
    this.checkInstanceOf(value, BigNumber, 'maxAmount');
    this._maxAmount = value;
  }

  get selectedFiatType() {
    return this._selectedFiatType;
  }

  set selectedFiatType(value) {
    this.checkType(value, ['string'], 'selectedFiatType');
    this._selectedFiatType = value;
  }

  get token() {
    return this._token;
  }

  set token(value) {
    this.checkType(value, ['object'], 'token');
    this._token = value;
  }

  get fiatAmount() {
    return this._fiatAmount;
  }

  set fiatAmount(value) {
    this.checkInstanceOf(value, BigNumber, 'fiatAmount');
    this._fiatAmount = value;
  }

  get ownerAddress() {
    return this._ownerAddress;
  }

  set ownerAddress(value) {
    this.checkType(value, ['string'], 'ownerAddress');
    this._ownerAddress = value;
  }

  get recipientAddress() {
    return this._recipientAddress;
  }

  set recipientAddress(value) {
    this.checkType(value, ['string'], 'recipientAddress');
    this._recipientAddress = value;
  }

  get pendingRecipientAddress() {
    return this._pendingRecipientAddress;
  }

  set pendingRecipientAddress(value) {
    this.checkType(value, ['string'], 'pendingRecipientAddress');
    this._pendingRecipientAddress = value;
  }

  get status() {
    if (this.isArchived) {
      return this.donationCounters.some(dc => dc.currentBalance.gt(0))
        ? Milestone.COMPLETED
        : Milestone.PAID;
    }

    return this._status;
  }

  set status(value) {
    this.checkValue(value, Object.values(Milestone.statuses), 'status');
    this._status = value;
  }

  get campaignTitle() {
    return this._campaignTitle;
  }

  set campaignTitle(value) {
    this.checkType(value, ['string'], 'campaignTitle');
    this._campaignTitle = value;
  }

  get projectId() {
    return this._projectId;
  }

  set projectId(value) {
    this.checkType(value, ['string'], 'projectId');
    this._projectId = value;
  }

  get reviewerAddress() {
    return this._reviewerAddress;
  }

  set reviewerAddress(value) {
    this.checkType(value, ['string', 'undefined'], 'reviewerAddress');
    this._reviewerAddress = value;
  }

  get dacId() {
    return this._dacId;
  }

  set dacId(value) {
    this.checkType(value, ['number'], 'dacId');
    this._dacId = value;
  }

  get items() {
    return this._items;
  }

  set items(value) {
    value.forEach(item => {
      this.checkInstanceOf(item, MilestoneItemModel, 'items');
    });

    this._items = value;
  }

  get itemizeState() {
    return this._itemizeState;
  }

  set itemizeState(value) {
    this.checkType(value, ['boolean'], 'itemizeState');
    this._itemizeState = value;
  }

  get date() {
    return this._date;
  }

  set date(value) {
    this.checkIsMoment(value, 'date');
    this._date = value;
  }

  get confirmations() {
    return this._confirmations;
  }

  set confirmations(value) {
    this.checkType(value, ['number'], 'confirmations');
    this._confirmations = value;
  }

  get requiredConfirmations() {
    return this._requiredConfirmations;
  }

  set requiredConfirmations(value) {
    this.checkType(value, ['number'], 'requiredConfirmations');
    this._requiredConfirmations = value;
  }

  get commitTime() {
    return this._commitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['number'], 'commitTime');
    this._commitTime = value;
  }

  get currentBalance() {
    if (!this.isCapped) return undefined;
    if (
      this.acceptsSingleToken &&
      Array.isArray(this._donationCounters) &&
      this._donationCounters.length > 0
    ) {
      return this._donationCounters[0].currentBalance;
    }
    return new BigNumber('0');
  }

  // It has meaning just for capped milestones
  get totalDonatedSingleToken() {
    if (!this.isCapped) return undefined;
    if (
      this.acceptsSingleToken &&
      Array.isArray(this._donationCounters) &&
      this._donationCounters.length > 0
    ) {
      return this._donationCounters[0].totalDonated;
    }
    return new BigNumber('0');
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

  get mined() {
    return this._mined;
  }

  set mined(value) {
    this.checkType(value, ['boolean'], 'mined');
    this._mined = value;
  }

  get pluginAddress() {
    return this._pluginAddress;
  }

  set pluginAddress(value) {
    this.checkType(value, ['string'], 'pluginAddress');
    this._pluginAddress = value;
  }

  // transient
  get campaign() {
    return this._campaign;
  }

  get owner() {
    return this._owner;
  }

  get coowner() {
    return this._coowner;
  }

  get reviewer() {
    return this._reviewer;
  }

  get recipient() {
    return this._recipient;
  }

  get pendingRecipient() {
    return this._pendingRecipient;
  }

  set campaignId(value) {
    this.checkType(value, ['string'], 'campaignId');
    this._campaignId = value;
  }

  get campaignId() {
    return this._campaignId;
  }

  set conversionRateTimestamp(value) {
    this._conversionRateTimestamp = value;
  }

  get conversionRateTimestamp() {
    return this._conversionRateTimestamp;
  }

  set conversionRate(value) {
    this.checkType(value, ['number'], 'conversionRate');
    this._conversionRate = value;
  }

  get conversionRate() {
    return this._conversionRate;
  }

  // computed
  get hasReviewer() {
    return this._reviewerAddress !== undefined && this._reviewerAddress !== ZERO_ADDRESS;
  }

  get delegatePercent() {
    return this._dacId !== undefined && this._dacId !== 0;
  }

  get hasRecipient() {
    return (
      (this._recipientAddress !== undefined && this._recipientAddress !== ZERO_ADDRESS) ||
      this._pendingRecipientAddress
    );
  }

  get acceptsSingleToken() {
    return this._token && this._token.foreignAddress !== ANY_TOKEN.foreignAddress;
  }

  get isCapped() {
    return this._maxAmount !== undefined;
  }

  get isArchived() {
    return this._status === Milestone.ARCHIVED;
  }

  canUserAcceptRejectProposal(user) {
    return (
      user &&
      (this.campaign.ownerAddress === user.address ||
        this.campaign.coownerAddress === user.address) &&
      this.status === Milestone.PROPOSED
    );
  }

  canUserRepropose(user) {
    return user && this.ownerAddress === user.address && this.status === Milestone.REJECTED;
  }

  canUserDelete(user) {
    return (
      user &&
      this.ownerAddress === user.address &&
      [Milestone.REJECTED, Milestone.PROPOSED].includes(this.status)
    );
  }

  canUserCancel(user) {
    return (
      user &&
      [this.reviewerAddress, this.ownerAddress].includes(user.address) &&
      [Milestone.IN_PROGRESS, Milestone.NEEDS_REVIEW].includes(this.status) &&
      this.mined
    );
  }

  canUserMarkComplete(user) {
    return (
      user &&
      // if no reviewerAddress, then there is no need to markComplete
      this.reviewerAddress &&
      this.reviewerAddress !== ZERO_ADDRESS &&
      this.status === Milestone.IN_PROGRESS &&
      this.mined &&
      (this.ownerAddress === user.address ||
        (!this.pendingRecipientAddress && this.recipientAddress === user.address))
    );
  }

  canUserApproveRejectCompletion(user) {
    return (
      user &&
      this.status === Milestone.NEEDS_REVIEW &&
      this.reviewerAddress === user.address &&
      this.mined
    );
  }

  canUserWithdraw(user) {
    return (
      user &&
      this.hasRecipient &&
      (this.ownerAddress === user.address ||
        (!this.pendingRecipientAddress && this.recipientAddress === user.address)) &&
      (!this.hasReviewer || this.status === Milestone.COMPLETED) &&
      this.mined &&
      this.donationCounters.some(dc => dc.currentBalance.gt(0))
    );
  }

  canUserEdit(user) {
    return (
      user &&
      user.address &&
      [this.ownerAddress, this.campaign.ownerAddress, this.campaign.coownerAddress].includes(
        user.address,
      ) &&
      [
        Milestone.PROPOSED,
        Milestone.REJECTED,
        Milestone.IN_PROGRESS,
        Milestone.NEEDS_REVIEW,
      ].includes(this.status) &&
      this.totalDonations <= 0
    );
  }

  canUserChangeRecipient(user) {
    return (
      user &&
      [Milestone.IN_PROGRESS, Milestone.NEEDS_REVIEW].includes(this.status) &&
      !this.pendingRecipientAddress &&
      ((!this.hasRecipient && this.ownerAddress === user.address) ||
        (this.hasRecipient && this.recipientAddress === user.address))
    );
  }

  canUserArchive(user) {
    return (
      user &&
      (!this.isCapped || this.fullyFunded === false) && // There is no reason to archive fully funded capped milestone
      this.hasRecipient &&
      ((this.status === Milestone.IN_PROGRESS && !this.hasReviewer) ||
        (this.status === Milestone.COMPLETED && !this.isArchived)) &&
      [this.ownerAddress, this.campaign.ownerAddress].includes(user.address)
    );
  }
}
