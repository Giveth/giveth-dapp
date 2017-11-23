import BasicModel from './BasicModel';
import DACservice from '../services/DAC';
import UploadService from '../services/Uploads';
/**
 * The DApp DAC model
 */
class DAC extends BasicModel {
  constructor({
    title = '', description = '', communityUrl = '', summary = '', delegateId = '0', image = '', _id,
    txHash, totalDonated = '0', donationCount = 0, tokenName = '', tokenSymbol = '', owner,
  }) {
    super();

    this.id = _id;
    this.title = title;
    this.description = description;
    this.communityUrl = communityUrl;
    this.summary = summary;
    this.delegateId = delegateId;
    this.image = image;
    this.txHash = txHash;
    this.totalDonated = totalDonated;
    this.donationCount = donationCount;
    this.tokenName = tokenName;
    this.tokenSymbol = tokenSymbol;
    this.newImage = false;
    this.owner = owner;
  }

  toFeathers() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      communityUrl: this.communityUrl,
      summary: this.summary,
      delegateId: this.delegateId,
      image: this.image,
      txHash: this.txHash,
      totalDonated: this.totalDonated,
      donationCount: this.donationCount,
      tokenName: this.tokenName,
      tokenSymbol: this.tokenSymbol,
    };
  }

  save(onCreated, afterEmit) {
    if (this.newImage) {
      UploadService.save(this.image).then((file) => {
        // Save the new image address and mark it as old
        this.image = file.url;
        this.newImage = false;

        DACservice.save(this, onCreated, afterEmit);
      });
    } else {
      DACservice.save(this, onCreated, afterEmit);
    }
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

  get communityUrl() {
    return this.myCommunityUrl;
  }

  set communityUrl(value) {
    this.checkType(value, ['string'], 'communityUrl');
    this.myCommunityUrl = value;
  }

  get summary() {
    return this.mySummary;
  }

  set summary(value) {
    this.checkType(value, ['string'], 'summary');
    this.mySummary = value;
  }

  get delegateId() {
    return this.myDelegateId;
  }

  set delegateId(value) {
    this.checkType(value, ['string'], 'delegateId');
    this.myDelegateId = value;
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

  get totalDonated() {
    return this.myTotalDonated;
  }

  set totalDonated(value) {
    // TODO: Fix the value to always be string
    if (typeof value === 'number') {
      console.error('Total donated should always be string as it is bignumber! Fix it in feathers');
    }
    this.checkType(value, ['number', 'string'], 'totalDonated');
    this.myTotalDonated = value;
  }

  get donationCount() {
    return this.myDonationCount;
  }

  set donationCount(value) {
    this.checkType(value, ['number'], 'donationCount');
    this.myDonationCount = value;
  }

  get tokenName() {
    return this.myTokenName;
  }

  set tokenName(value) {
    this.checkType(value, ['string'], 'tokenName');
    this.myTokenName = value;
  }

  get tokenSymbol() {
    return this.myTokenSymbol;
  }

  set tokenSymbol(value) {
    this.checkType(value, ['string'], 'tokenSymbol');
    this.myTokenSymbol = value;
  }

  get owner() {
    return this.myOwner;
  }

  set owner(value) {
    this.checkType(value, ['undefined', 'object'], 'owner');
    this.myOwner = value;
  }
}

export default DAC;
