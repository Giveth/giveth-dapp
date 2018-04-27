import BasicModel from './BasicModel';
import CampaignService from '../services/Campaign';
import UploadService from '../services/Uploads';
/**
 * The DApp Campaign model
 */
class Campaign extends BasicModel {
  static get CANCELED() {
    return 'Canceled';
  }
  static get PENDING() {
    return 'Pending';
  }
  static get ACTIVE() {
    return 'Active';
  }

  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.projectId = data.projectId || '0';
    this.tokenName = data.tokenName || '';
    this.tokenSymbol = data.tokenSymbol || '';
    this.dacs = data.dacs || [];
    this.pluginAddress = data.pluginAddress || '0x0000000000000000000000000000000000000000';
    this.status = data.status || Campaign.PENDING;
    this.reviewerAddress = data.reviewerAddress;
  }

  toFeathers() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      communityUrl: this.communityUrl,
      summary: this.summary,
      projectId: this.projectId,
      image: this.image,
      txHash: this.txHash,
      totalDonated: this.totalDonated,
      donationCount: this.donationCount,
      peopleCount: this.peopleCount,
      tokenName: this.tokenName,
      tokenSymbol: this.tokenSymbol,
      dacs: this.dacs,
      reviewerAddress: this.reviewerAddress,
      status: this.status,
    };
  }

  get isActive() {
    return this.status === Campaign.ACTIVE;
  }

  /**
   * Save the campaign to feathers and blockchain if necessary
   *
   * @param afterCreate Callback function once a transaction is created
   * @param afterMined  Callback function once the transaction is mined and feathers updated
   */
  save(afterCreate, afterMined) {
    if (this.newImage) {
      UploadService.save(this.image).then(file => {
        // Save the new image address and mark it as old
        this.image = file.url;
        this.newImage = false;

        CampaignService.save(this, this.owner.address, afterCreate, afterMined);
      });
    } else {
      CampaignService.save(this, this.owner.address, afterCreate, afterMined);
    }
  }

  /**
   * Cancel the campaign in feathers and blockchain
   *
   * @param from        Either the owner or reviewer. Whoever is canceling the campaign
   * @param afterCreate Callback function once a transaction is created
   * @param afterMined  Callback function once the transaction is mined and feathers updated
   */
  cancel(from, afterCreate, afterMined) {
    CampaignService.cancel(this, from, afterCreate, afterMined);
  }

  get communityUrl() {
    return this.myCommunityUrl;
  }

  set communityUrl(value) {
    this.checkType(value, ['string'], 'communityUrl');
    this.myCommunityUrl = value;
  }

  get projectId() {
    return this.myProjectId;
  }

  set projectId(value) {
    this.checkType(value, ['string'], 'projectId');
    this.myProjectId = value;
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
    this.checkValue(value, [Campaign.PENDING, Campaign.ACTIVE, Campaign.CANCELED], 'status');
    this.myStatus = value;
    if (value === Campaign.PENDING) this.myOrder = 1;
    else if (value === Campaign.ACTIVE) this.myOrder = 2;
    else if (value === Campaign.CANCELED) this.myOrder = 3;
    else this.myOrder = 4;
  }

  get dacs() {
    return this.myDacs;
  }

  set dacs(value) {
    this.checkType(value, ['object', 'array'], 'dacs');
    this.myDacs = value;
  }

  get pluginAddress() {
    return this.myPluginAddress;
  }

  set pluginAddress(value) {
    this.checkType(value, ['string'], 'pluginAddress');
    this.myPluginAddress = value;
  }

  get reviewerAddress() {
    return this.myReviewerAddress;
  }

  set reviewerAddress(value) {
    this.checkType(value, ['string', 'undefined'], 'reviewerAddress');
    this.myReviewerAddress = value;
  }
}

export default Campaign;
