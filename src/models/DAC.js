import BasicModel from './BasicModel';
import DACservice from '../services/DAC';
import UploadService from '../services/Uploads';
/**
 * The DApp DAC model
 */
class DAC extends BasicModel {
  static get CANCELED() { return 'Canceled'; }
  static get PENDING() { return 'Pending'; }
  static get ACTIVE() { return 'Active'; }

  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.delegateId = data.delegateId || '';
    this.tokenName = data.tokenName || '';
    this.tokenSymbol = data.tokenSymbol || '';
    this.status = data.status || DAC.PENDING;
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
    if (this.delegateId !== '') return DAC.ACTIVE; // TODO: Remove once status is added to feathers
    return this.myStatus;
  }

  set status(value) {
    this.checkValue(value, [DAC.PENDING, DAC.ACTIVE, DAC.CANCELED], 'status');
    this.myStatus = value;
    if (value === DAC.PENDING) this.myOrder = 1;
    else if (value === DAC.ACTIVE) this.myOrder = 2;
    else if (value === DAC.CANCELED) this.myOrder = 3;
    else this.myOrder = 4;
  }
}

export default DAC;
