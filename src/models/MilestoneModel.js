import React from 'react';
import BigNumber from 'bignumber.js';
import { getStartOfDayUTC, getRandomWhitelistAddress } from 'lib/helpers';
import BasicModel from './BasicModel';

import MilestoneModelItemModel from './MilestoneItemModel';
/**
 * The DApp MilestoneModel model
 */
export default class MilestoneModel extends BasicModel {
  constructor(data) {
    super(data);

    this._maxAmount = data.maxAmount || new BigNumber(0);
    this._fiatAmount = data.fiatAmount || new BigNumber(0);
    this._recipientAddress = data.recipientAddress || '';
    this._status = data.status || MilestoneModel.PENDING;
    this._campaignTitle = data.campaignTitle || '';
    this._projectId = data.projectId || '';
    this._reviewAddress =
      React.whitelist.reviewerWhitelist.length > 0
        ? getRandomWhitelistAddress(React.whitelist.reviewerWhitelist).address
        : '';
    this._items = data.items || [];
    this._itemizeState = data.itemizeState || false;
    this._date = getStartOfDayUTC().subtract(1, 'd');

    this._id = data._id;
    this._confirmations = data.confirmations || 0;
    this._requiredConfirmations = data.requiredConfirmations;
    this._commitTime = data.commitTime || 0;
    this._token = data.token || React.whitelist.tokenWhitelist.find(t => t.symbol === 'ETH').address
  }

  /**
    methods
  * */

  save() {
    // console.log('milestone model', this)
  }

  /**
    get & setters
  * */

  static get PROPOSED() {
    return MilestoneModel.statuses.PROPOSED;
  }

  static get REJECTED() {
    return MilestoneModel.statuses.REJECTED;
  }

  static get PENDING() {
    return MilestoneModel.statuses.PENDING;
  }

  static get IN_PROGRESS() {
    return MilestoneModel.statuses.IN_PROGRESS;
  }

  static get NEEDS_REVIEW() {
    return MilestoneModel.statuses.NEEDS_REVIEW;
  }

  static get COMPLETED() {
    return MilestoneModel.statuses.COMPLETED;
  }

  static get CANCELED() {
    return MilestoneModel.statuses.CANCELED;
  }

  static get PAYING() {
    return MilestoneModel.statuses.PAYING;
  }

  static get PAID() {
    return MilestoneModel.statuses.PAID;
  }

  static get FAILED() {
    return MilestoneModel.statuses.FAILED;
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
    return 'MilestoneModel';
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

  get image() {
    return this._image;
  }

  set image(value) {
    this.checkType(value, ['string'], 'image');
    this._image = value;
  }

  get maxAmount() {
    return this._maxAmount;
  }

  set maxAmount(value) {
    this.checkInstanceOf(value, BigNumber, 'maxAmount');
    this._maxAmount = value;
  }

  get fiatAmount() {
    return this._fiatAmount;
  }

  set fiatAmount(value) {
    this.checkInstanceOf(value, BigNumber, 'fiatAmount');
    this._fiatAmount = value;
  }

  get recipientAddress() {
    return this._recipientAddress;
  }

  set recipientAddress(value) {
    this.checkType(value, ['string'], 'recipientAddress');
    this._recipientAddress = value;
  }

  get status() {
    return this._status;
  }

  set status(value) {
    this.checkValue(value, Object.values(MilestoneModel.statuses), 'status');
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

  get reviewAddress() {
    return this._reviewAddress;
  }

  set reviewAddress(value) {
    this.checkType(value, ['string'], 'reviewAddress');
    this._reviewAddress = value;
  }

  get items() {
    return this._items;
  }

  set items(value) {
    value.forEach(item => {
      this.checkInstanceOf(item, MilestoneModelItemModel, 'items');
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
    this.checkType(value, ['date'], 'date');
    this._date = value;
  }

  get id() {
    return this._id;
  }

  set id(value) {
    if (value) {
      this.checkType(value, ['string'], '_id');
      this._id = value;
    }
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

  get token() {
    return this._token;
  }

  set token(value) {
    this._token = value
  }
}
