import { LPPCampaign, LPPCampaignFactory } from 'lpp-campaign';
import { paramsForServer } from 'feathers-hooks-common';
import Trace from '../models/Trace';
import extraGas from '../lib/blockchain/extraGas';
import { feathersClient } from '../lib/feathersClient';
import Campaign from '../models/Campaign';
import Donation from '../models/Donation';
import config from '../configuration';
import IPFSService from './IPFSService';
import ErrorPopup from '../components/ErrorPopup';
import ErrorModel from '../models/ErrorModel';
import ErrorHandler from '../lib/ErrorHandler';

const etherScanUrl = config.etherscan;
const campaigns = feathersClient.service('campaigns');

class CampaignService {
  constructor() {
    this.campaignSubscription = null;
  }

  /**
   * Get a Campaign defined by ID
   *
   * @param id   ID of the Campaign to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      campaigns
        .find({ query: { _id: id } })
        .then(resp => {
          if (resp.data.length) resolve(new Campaign(resp.data[0]));
          else reject(new ErrorModel({ message: 'Not found', status: 404 }));
        })
        .catch(reject);
    });
  }

  /**
   * Get a campaign defined by slug
   *
   * @param slug   Slug of the campaign to be retrieved
   */
  static getBySlug(slug) {
    return new Promise((resolve, reject) => {
      campaigns
        .find({
          query: {
            slug,
          },
        })
        .then(resp => {
          if (resp.data.length) resolve(new Campaign(resp.data[0]));
          else {
            reject(new ErrorModel({ message: 'Not found', status: 404 }));
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Resolves whether a campaign exists with provided slug
   *
   * @param slug   Slug of the campaign to be retrieved
   */
  static async getActiveCampaignExistsBySlug(slug) {
    const resp = await campaigns.find({
      query: {
        slug,
        status: Campaign.ACTIVE,
        $limit: 0,
      },
    });

    return resp.total > 0;
  }

  /**
   * Get Campaigns
   *
   * @param $limit      Amount of records to be loaded
   * @param $skip       Amounds of record to be skipped
   * @param onlyRecent  Bool flag only fetch campaigns updated recently (projectsUpdatedAtLimitMonth)
   * @param onSuccess   Callback function once response is obtained successfylly
   * @param onError     Callback function if error is encountered
   */
  static getCampaigns(
    $limit = 100,
    $skip = 0,
    onlyRecent = false,
    onSuccess = () => {},
    onError = () => {},
  ) {
    const query = {
      projectId: { $gt: 0 }, // 0 is a pending campaign
      status: Campaign.ACTIVE,
      $limit,
      $skip,
      // Should set a specific prop for "qualified" updates
      // Current impl will allow a campaign manager to be first
      // in the list by just editing the campaign
      $sort: { updatedAt: -1 },
    };

    if (onlyRecent) {
      const lastDate = new Date();
      lastDate.setMonth(lastDate.getMonth() - config.projectsUpdatedAtLimitMonth);

      query.updatedAt = { $gt: lastDate };
    }
    return campaigns
      .find({
        query,
      })
      .then(resp => {
        onSuccess(
          resp.data.map(c => new Campaign(c)),
          resp.total,
        );
      })
      .catch(onError);
  }

  static async getCampaignsByIdArray(campaignIds) {
    const query = {
      _id: { $in: campaignIds }, // 0 is a pending campaign
      status: Campaign.ACTIVE,
      $sort: { updatedAt: -1 },
    };
    const result = await campaigns.find({ query });
    return result.data.map(c => new Campaign(c));
  }

  /**
   * Get Campaign traces listener
   *
   * @param id            ID of the Campaign which donations should be retrieved
   * @param searchPhrase  Phrase to search traces by
   * @param $limit        Amount of records to be loaded
   * @param $skip         Amounds of record to be skipped
   * @param onSuccess     Callback function once response is obtained successfully
   * @param onError       Callback function if error is encountered
   */
  static getTraces(
    id,
    searchPhrase = '',
    $limit = 100,
    $skip = 0,
    onSuccess = () => {},
    onError = () => {},
  ) {
    const query = {
      campaignId: id,
      status: {
        $nin: [Trace.CANCELED, Trace.PROPOSED, Trace.REJECTED, Trace.PENDING],
      },
      $or: [{ donationCounters: { $not: { $size: 0 } } }, { status: { $ne: Trace.COMPLETED } }],
      $limit,
      $skip,
    };

    if (searchPhrase) {
      query.$text = { $search: searchPhrase };
      query.$sort = { score: { $meta: 'textScore' } };
      query.$select = { score: { $meta: 'textScore' } };
    } else {
      query.$sort = { projectAddedAt: -1, projectId: -1 };
    }

    return feathersClient
      .service('traces')
      .find({
        query,
      })
      .then(resp =>
        onSuccess(
          resp.data.map(m => new Trace(m)),
          resp.total,
        ),
      )
      .catch(onError);
  }

  /**
   * Get Campaign donations
   *
   * @param id        ID of the Campaign which donations should be retrieved
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amount of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   * @param status    Status of donations to be loaded
   */
  static getDonations(
    id,
    $limit = 100,
    $skip = 0,
    onSuccess = () => {},
    onError = () => {},
    status,
  ) {
    const query = {
      status: { $ne: Donation.FAILED },
      $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
      ownerTypeId: id,
      isReturn: false,
      $sort: { usdValue: -1, createdAt: -1 },
      $limit,
      $skip,
    };
    if (status) {
      query.status = status;
    }
    return feathersClient
      .service('donations')
      .find(
        paramsForServer({
          query,
          schema: 'includeTypeAndGiverDetails',
        }),
      )
      .then(resp =>
        onSuccess(
          resp.data.map(d => new Donation(d)),
          resp.total,
        ),
      )
      .catch(onError);
  }

  /**
   * Subscribe to count of new donations. Initial resp will always be 0. Any new donations
   * that come in while subscribed, the onSuccess will be called with the # of newDonations
   * since initial subscribe
   *
   * @param id        ID of the Campaign which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribeNewDonations(id, onSuccess, onError) {
    let initalTotal;
    return feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          status: { $ne: Donation.FAILED },
          $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
          ownerTypeId: id,
          isReturn: false,
          $limit: 0,
        },
      })
      .subscribe(resp => {
        if (initalTotal === undefined) {
          initalTotal = resp.total;
          onSuccess(0);
        } else {
          onSuccess(resp.total - initalTotal);
        }
      }, onError);
  }

  /**
   * Get the user's Campaigns
   *
   * @param userAddress Address of the user whose Campaign list should be retrieved
   * @param skipPages     Amount of pages to skip
   * @param itemsPerPage  Items to retreive
   * @param onSuccess   Callback function once response is obtained successfully
   * @param onError     Callback function if error is encountered
   */
  static getUserCampaigns(userAddress, skipPages, itemsPerPage, onSuccess, onError, subscribe) {
    const query = {
      query: {
        $or: [
          { ownerAddress: userAddress },
          { reviewerAddress: userAddress },
          { coownerAddress: userAddress },
        ],
        $sort: {
          createdAt: -1,
        },
        $limit: itemsPerPage,
        $skip: skipPages * itemsPerPage,
      },
    };

    if (subscribe) {
      return this.subscribe(query, onSuccess, onError);
    }
    return campaigns
      .find(query)
      .then(resp => {
        onSuccess({
          ...resp,
          data: resp.data.map(c => new Campaign(c)),
        });
      })
      .catch(onError);
  }

  static subscribe(query, onSuccess, onError) {
    return campaigns
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(resp => {
        onSuccess({
          ...resp,
          data: resp.data.map(c => new Campaign(c)),
        });
      }, onError);
  }

  /**
   * Save new Campaign to the blockchain or update existing one in feathers
   * TODO: Handle error states properly
   *
   * @param campaign    Campaign object to be saved
   * @param from        address of the user saving the Campaign
   * @param afterSave   Callback to be triggered after the Campaign is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   * @param web3  Web3  instance
   * @param networkOnly Do not send to DB
   */
  static async save(
    campaign,
    from,
    afterSave = () => {},
    afterMined = () => {},
    web3,
    networkOnly,
  ) {
    if (campaign.id && campaign.projectId === 0) {
      throw new Error(
        'You must wait for your Campaign to be creation to finish before you can update it',
      );
    }

    let txHash;
    try {
      let profileHash;
      try {
        profileHash = await IPFSService.upload(campaign.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload campaign to ipfs');
      }

      // nothing to update or failed ipfs upload
      if (campaign.projectId && (campaign.url === profileHash || !profileHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        let response;
        if (!profileHash) {
          response = await campaigns.patch(campaign.id, campaign.toFeathers(txHash));
        }
        afterSave({
          err: null,
          mined: false,
          txUrl: '',
          response: response || campaign,
        });

        afterMined(false, undefined, campaign.id);
        return;
      }

      let promise;
      if (campaign.projectId) {
        // LPPCampaign function update(string newName, string newUrl, uint64 newCommitTime)
        promise = new LPPCampaign(web3, campaign.pluginAddress).update(
          campaign.title,
          profileHash || '',
          0,
          {
            from,
            $extraGas: extraGas(),
          },
        );
      } else {
        // LPPCampaignFactory function newCampaign(string name, string url, uint64 parentProject, address reviewer)
        const lppCampaignFactory = new LPPCampaignFactory(web3, config.lppCampaignFactoryAddress);
        promise = lppCampaignFactory.newCampaign(
          campaign.title,
          profileHash || '',
          0,
          campaign.reviewerAddress,
          {
            from,
            $extraGas: extraGas(),
          },
        );
      }

      let { id } = campaign;
      await promise.once('transactionHash', async hash => {
        txHash = hash;
        let response;
        if (!networkOnly) {
          if (id) {
            response = await campaigns.patch(id, campaign.toFeathers(txHash));
          } else {
            response = await campaigns.create(campaign.toFeathers(txHash));
            id = response._id;
          }
        }
        afterSave({
          err: null,
          mined: !campaign.projectId,
          txUrl: `${etherScanUrl}tx/${txHash}`,
          txHash,
          response,
          profileHash,
        });
      });

      afterMined(!campaign.projectId, `${etherScanUrl}tx/${txHash}`, id);
    } catch (err) {
      const message = `Something went wrong with the Campaign ${
        campaign.projectId > 0 ? 'update' : 'creation'
      }. Is your wallet unlocked? ${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`;
      ErrorHandler(err, message);
      afterSave(err);
    }
  }

  /**
   * Change ownership from campaign
   *
   * //TODO: update contact for transaction on this
   *
   * @param campaign    Campaign to be modified
   * @param from        Address of the user changing the Campaign
   * @param owner       Address of the user that will own the Campaign
   * @param coowner     Address of the user that will coown the Campaign
   * @param afterCreate Callback to be triggered after the Campaign is cancelled in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static changeOwnership(
    campaign,
    from,
    owner,
    coowner,
    afterCreate = () => {},
    afterMined = () => {},
  ) {
    campaigns
      .patch(campaign.id, {
        ownerAddress: owner,
        coownerAddress: coowner,
      })
      .then(() => {
        afterCreate();
        afterMined();
      })
      .catch(err => {
        ErrorPopup('Something went wrong with updating campaign', err);
      });
  }

  /**
   * Change funds forwarder address on a campaign
   *
   * //TODO: update contact for transaction on this
   *
   * @param campaignId    Campaign ID to be modified
   * @param address        Address of the funds forwarder
   */
  static addFundsForwarderAddress(
    campaignId,
    address,
    afterCreate = () => {},
    afterMined = () => {},
  ) {
    campaigns
      .patch(campaignId, {
        fundsForwarder: address,
      })
      .then(() => {
        afterCreate();
        afterMined();
      })
      .catch(err => {
        ErrorPopup('Something went wrong with updating campaign', err);
      });
  }

  /**
   * Cancel Campaign in the blockchain and update it in feathers
   * TODO: Handle error states properly
   *
   * @param campaign    Campaign to be cancelled
   * @param from        Address of the user cancelling the Campaign
   * @param afterCreate Callback to be triggered after the Campaign is cancelled in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   * @param web3
   */
  static cancel(campaign, from, afterCreate = () => {}, afterMined = () => {}, web3) {
    let txHash;
    const lppCampaign = new LPPCampaign(web3, campaign.pluginAddress);

    lppCampaign
      .cancelCampaign({ from, $extraGas: extraGas() })
      .once('transactionHash', hash => {
        txHash = hash;
        campaigns
          .patch(campaign.id, {
            status: Campaign.CANCELED,
            mined: false,
            // txHash, // TODO create a transaction entry
          })
          .then(() => afterCreate(`${etherScanUrl}tx/${txHash}`))
          .catch(err => {
            ErrorPopup('Something went wrong with updating campaign', err);
          });
      })
      .then(() => afterMined(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorHandler(err, 'Something went wrong with cancelling your campaign');
      });
  }
}

export default CampaignService;
