import React from 'react';
import BigNumber from 'bignumber.js';
import { getStartOfDayUTC, getRandomWhitelistAddress } from 'lib/helpers';
import Model from './Model';

import MilestoneItemModel from './MilestoneItemModel';
/**
 * The DApp donation model
 */
class Milestone extends Model {
  constructor(data) {
    super(data);

    this.title = data.title || '';
    this.description = data.description || '';
    this.image = data.image || '';
    this.maxAmount = data.maxAmount || new BigNumber(0);
    this.fiatAmount = data.fiatAmount || new BigNumber(0);
    this.recipientAddress = data.recipientAddress || '';
    this.status = data.status || Milestone.PENDING;
    this.campaignTitle = data.campaignTitle || '';
    this.projectId = data.projectId || '';
    this.reviewAddress =
      React.whitelist.reviewerWhitelist.length > 0
        ? getRandomWhitelistAddress(React.whitelist.reviewerWhitelist).address
        : '';
    this.items = data.items || [];
    this.itemizeState = data.itemizeState || false;
    this.date = getStartOfDayUTC().subtract(1, 'd');

    this._id = data._id;
    this.confirmations = data.confirmations || 0;
    this.requiredConfirmations = data.requiredConfirmations;
    this.commitTime = data.commitTime || 0;
  }

  /**
    methods
  * */

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
    };
  }

  static get type() {
    return 'milestone';
  }

  get title() {
    return this.title;
  }

  set title(value) {
    this.checkType(value, ['string'], 'title');
    this.title = value;
  }

  get description() {
    return this.description;
  }

  set description(value) {
    this.checkType(value, ['string'], 'description');
    this.description = value;
  }

  get image() {
    return this.image;
  }

  set image(value) {
    this.checkType(value, ['string'], 'image');
    this.image = value;
  }

  get maxAmount() {
    return this.maxAmount;
  }

  set maxAmount(value) {
    this.checkInstanceOf(value, BigNumber, 'maxAmount');
    this.maxAmount = value;
  }

  get fiatAmount() {
    return this.fiatAmount;
  }

  set fiatAmount(value) {
    this.checkInstanceOf(value, BigNumber, 'fiatAmount');
    this.fiatAmount = value;
  }

  get recipientAddress() {
    return this.recipientAddress;
  }

  set recipientAddress(value) {
    this.checkType(value, ['string'], 'recipientAddress');
    this.recipientAddress = value;
  }

  get status() {
    return this.status;
  }

  set status(value) {
    this.checkType(value, Object.keys(Milestone.values), 'status');
    this.status = value;
  }

  get campaignTitle() {
    return this.campaignTitle;
  }

  set campaignTitle(value) {
    this.checkType(value, ['string'], 'campaignTitle');
    this.campaignTitle = value;
  }

  get projectId() {
    return this.projectId;
  }

  set projectId(value) {
    this.checkType(value, ['string'], 'projectId');
    this.projectId = value;
  }

  get reviewAddress() {
    return this.reviewAddress;
  }

  set reviewAddress(value) {
    this.checkType(value, ['string'], 'reviewAddress');
    this.reviewAddress = value;
  }

  get items() {
    return this.items;
  }

  set items(value) {
    value.forEach(item => {
      this.checkInstanceOf(item, MilestoneItemModel, 'items');
    });

    this.items = value;
  }

  get itemizeState() {
    return this.itemizeState;
  }

  // TO DO >>> ITEM MODEL!
  set itemizeState(value) {
    this.checkType(value, ['boolean'], 'itemizeState');
    this.itemizeState = value;
  }

  get date() {
    return this.date;
  }

  set date(value) {
    this.checkType(value, ['date'], 'date');
    this.date = value;
  }

  get _id() {
    return this._id;
  }

  set _id(value) {
    this.checkType(value, ['string'], '_id');
    this._id = value;
  }

  get confirmations() {
    return this.confirmations;
  }

  set confirmations(value) {
    this.checkType(value, ['number'], 'confirmations');
    this.confirmations = value;
  }

  get requiredConfirmations() {
    return this.requiredConfirmations;
  }

  set requiredConfirmations(value) {
    this.checkType(value, ['number'], 'requiredConfirmations');
    this.requiredConfirmations = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['number'], 'commitTime');
    this.myCommitTime = value;
  }
}

export default Milestone;
