import React from 'react';
import BasicModel from './BasicModel';
import CampaignService from '../services/Campaign';
import UploadService from '../services/Uploads';
import { getRandomWhitelistAddress } from '../lib/helpers';
/**
 * The DApp Campaign model
 */
class Campaign extends BasicModel {
  constructor(data) {
    super(data);

    this.communityUrl = data.communityUrl || '';
    this.projectId = data.projectId || '0';
    this.tokenName = data.tokenName || '';
    this.tokenSymbol = data.tokenSymbol || '';
    this.dacs = data.dacs || [];
    this.reviewerAddress = data.reviewerAddress ||
      getRandomWhitelistAddress(React.whitelist.reviewerWhitelist);
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
      tokenName: this.tokenName,
      tokenSymbol: this.tokenSymbol,
      dacs: this.dacs,
      reviewerAddress: this.reviewerAddress,
    };
  }

  save(onCreated, afterEmit) {
    if (this.newImage) {
      UploadService.save(this.image).then((file) => {
        // Save the new image address and mark it as old
        this.image = file.url;
        this.newImage = false;

        CampaignService.save(this, this.owner.address, onCreated, afterEmit);
      });
    } else {
      CampaignService.save(this, this.owner.address, onCreated, afterEmit);
    }
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

  get dacs() {
    return this.myDacs;
  }

  set dacs(value) {
    this.checkType(value, ['object', 'array'], 'dacs');
    this.myDacs = value;
  }
}

export default Campaign;
