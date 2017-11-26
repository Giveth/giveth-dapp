import BasicModel from './BasicModel';
import DACservice from '../services/DAC';
import UploadService from '../services/Uploads';
/**
 * The DApp DAC model
 */
class DAC extends BasicModel {
  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.delegateId = data.delegateId || '';
    this.tokenName = data.tokenName || '';
    this.tokenSymbol = data.tokenSymbol || '';
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

        DACservice.save(this, this.owner.address, onCreated, afterEmit);
      });
    } else {
      DACservice.save(this, this.owner.address, onCreated, afterEmit);
    }
  }

  get communityUrl() {
    return this.myCommunityUrl;
  }

  set communityUrl(value) {
    this.checkType(value, ['string'], 'communityUrl');
    this.myCommunityUrl = value;
  }

  get delegateId() {
    return this.myDelegateId;
  }

  set delegateId(value) {
    this.checkType(value, ['string'], 'delegateId');
    this.myDelegateId = value;

    this.status = value !== 0 ? 'Accepting donations' : 'Pending';
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

  get status() {
    return this.myStatus;
  }

  set status(value) {
    this.checkType(value, ['string'], 'status');
    this.myStatus = value;
  }
}

export default DAC;
