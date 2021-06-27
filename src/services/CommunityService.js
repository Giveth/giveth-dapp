import BigNumber from 'bignumber.js';

import { paramsForServer } from 'feathers-hooks-common';
import getNetwork from '../lib/blockchain/getNetwork';
import extraGas from '../lib/blockchain/extraGas';
import { feathersClient } from '../lib/feathersClient';
import Community from '../models/Community';
import Donation from '../models/Donation';
import IPFSService from './IPFSService';
import config from '../configuration';
import ErrorModel from '../models/ErrorModel';
import ErrorHandler from '../lib/ErrorHandler';

import ErrorPopup from '../components/ErrorPopup';
import { ZERO_ADDRESS } from '../lib/helpers';

BigNumber.config({ DECIMAL_PLACES: 18 });

const communities = feathersClient.service('communities');
const etherScanUrl = config.etherscan;

class CommunityService {
  constructor() {
    this.newDonationSubscription = null;
    this.communitySubscription = null;
  }

  /**
   * Get a Community defined by ID
   *
   * @param id   ID of the Community to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      communities
        .find({
          query: {
            _id: id,
          },
        })
        .then(resp => {
          if (resp.data.length) resolve(new Community(resp.data[0]));
          else reject(new ErrorModel({ message: 'Not found', status: 404 }));
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Get a Community defined by slug
   *
   * @param slug   Slug of the Community to be retrieved
   */
  static getBySlug(slug) {
    return new Promise((resolve, reject) => {
      communities
        .find({
          query: {
            slug,
          },
        })
        .then(resp => {
          if (resp.data.length) resolve(new Community(resp.data[0]));
          else reject(new ErrorModel({ message: 'Not found', status: 404 }));
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Get a Community defined by Delegate ID
   *
   *  @param delegateId Delegate Id of the Community to be retrieved
   */
  static getByDelegateId(delegateId) {
    return new Promise((resolve, reject) => {
      communities
        .find({
          query: {
            delegateId,
          },
        })
        .then(resp => {
          if (resp.total === 0) resolve(undefined);
          else resolve(new Community(resp.data[0]));
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Get Communities
   *
   * @param $limit      Amount of records to be loaded
   * @param $skip       Amounds of record to be skipped
   * @param onlyRecent  Bool flag only fetch campaigns updated recently (projectsUpdatedAtLimitMonth)
   * @param onSuccess   Callback function once response is obtained successfylly
   * @param onError     Callback function if error is encountered
   */
  static getCommunities(
    $limit = 100,
    $skip = 0,
    onlyRecent = false,
    onSuccess = () => {},
    onError = () => {},
  ) {
    const query = {
      status: Community.ACTIVE,
      $limit,
      $skip,
      $sort: { campaignsCount: -1, updatedAt: -1 },
    };

    if (onlyRecent) {
      const lastDate = new Date();
      lastDate.setMonth(lastDate.getMonth() - config.projectsUpdatedAtLimitMonth);

      query.updatedAt = { $gt: lastDate };
    }
    return communities
      .find({
        query,
      })
      .then(resp =>
        onSuccess(
          resp.data.map(d => new Community(d)),
          resp.total,
        ),
      )
      .catch(onError);
  }

  /**
   * Get Community donations
   *
   * @param id        ID of the Community which donations should be retrieved
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amounds of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static getDonations(id, $limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('donations')
      .find(
        paramsForServer({
          query: {
            status: { $ne: Donation.FAILED },
            delegateTypeId: id,
            isReturn: false,
            intendedProjectId: { $exists: false },
            $sort: { usdValue: -1, createdAt: -1 },
            $limit,
            $skip,
          },
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
    let initialTotal;
    this.newDonationSubscription = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          status: { $ne: Donation.FAILED },
          delegateTypeId: id,
          isReturn: false,
          intendedProjectId: { $exists: false },
          $limit: 0,
        },
      })
      .subscribe(resp => {
        if (initialTotal === undefined) {
          initialTotal = resp.total;
          onSuccess(0);
        } else {
          onSuccess(resp.total - initialTotal);
        }
      }, onError);

    return this.newDonationSubscription;
  }

  static unsubscribeNewDonations() {
    if (this.newDonationSubscription) this.newDonationSubscription.unsubscribe();
  }

  /**
   * Get the user's Communities
   *
   * @param userAddress   Address of the user whose Community list should be retrieved
   * @param skipPages     Amount of pages to skip
   * @param itemsPerPage  Items to retreive
   * @param onSuccess     Callback function once response is obtained successfully
   * @param onError       Callback function if error is encountered
   */
  static getUserCommunities(userAddress, skipPages, itemsPerPage, onSuccess, onError, subscribe) {
    const query = {
      query: {
        ownerAddress: userAddress,
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
    return communities
      .find(query)
      .then(resp => {
        onSuccess({
          ...resp,
          data: resp.data.map(c => new Community(c)),
        });
      })
      .catch(onError);
  }

  // All subscriptions goes here
  static subscribe(find, onSuccess, onError) {
    this.communitySubscription = communities
      .watch({ listStrategy: 'always' })
      .find(find)
      .subscribe(resp => {
        const newResp = { ...resp, data: resp.data.map(d => new Community(d)) };
        onSuccess(newResp);
      }, onError);

    return this.communitySubscription;
  }

  static unsubscribe() {
    if (this.communitySubscription) this.communitySubscription.unsubscribe();
  }

  /**
   * Get user is owner of some community
   *
   * @param userAddress Address of user which his ownership status should be returned
   * @param onSuccess     Callback function once response is obtained successfully
   * @param onError       Callback function if error is encountered
   */
  static getUserIsCommunityOwner(userAddress, onSuccess, onError) {
    return communities
      .find({
        query: {
          $limit: 0,
          ownerAddress: userAddress,
        },
      })
      .then(resp => {
        if (resp) onSuccess(resp.total > 0);
        else onSuccess(false);
      })
      .catch(onError);
  }

  /**
   * Save new Community to the blockchain or update existing one in feathers
   *
   * @param community         Community object to be saved
   * @param from        address of the user creating the Community
   * @param afterSave   Callback to be triggered after the Community is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static async save(
    community,
    from,
    afterSave = () => {},
    afterMined = () => {},
    onError = () => {},
  ) {
    if (community.id && community.delegateId === 0) {
      throw new Error(
        'You must wait for your Community to be creation to finish before you can update it',
      );
    }

    let txHash;

    const sendError = err => {
      const showMessageInPopup = err.data && err.data.showMessageInPopup;
      let message;
      if (showMessageInPopup) {
        message = err.message;
      } else {
        message = `Something went wrong with the Community ${
          community.delegateId > 0 ? 'update' : 'creation'
        }. Is your wallet unlocked? ${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`;
      }
      ErrorHandler(err, message, showMessageInPopup);
      onError();
    };
    try {
      // upload Community info to IPFS
      let ipfsHash;
      try {
        ipfsHash = await IPFSService.upload(community.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload Community to IPFS');
      }

      const network = await getNetwork();
      const { liquidPledging } = network;

      // nothing to update or failed ipfs upload
      if (community.delegateId && (community.url === ipfsHash || !ipfsHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!ipfsHash) {
          await communities.patch(community.id, community.toFeathers(txHash));
        }
        afterSave(null, false);
        afterMined(false, undefined, community.id);
        return;
      }

      // lp function updateDelegate(uint64 idDelegate,address newAddr,string newName,string newUrl,uint64 newCommitTime)
      // lp function addDelegate(string name,string url,uint64 commitTime,address plugin)
      const promise = community.delegateId
        ? liquidPledging.updateDelegate(
            community.delegateId,
            community.ownerAddress,
            community.title,
            ipfsHash || '',
            community.commitTime,
            { from, $extraGas: extraGas() },
          )
        : liquidPledging.addDelegate(community.title, ipfsHash || '', 0, ZERO_ADDRESS, {
            from,
            $extraGas: extraGas(),
          });

      let { id } = community;
      await new Promise((resolve, reject) => {
        promise.once('transactionHash', async hash => {
          txHash = hash;
          try {
            if (community.id) await communities.patch(community.id, community.toFeathers(txHash));
            else id = (await communities.create(community.toFeathers(txHash)))._id;
            afterSave(null, !community.delegateId, `${etherScanUrl}tx/${txHash}`);
            afterMined(!community.delegateId, `${etherScanUrl}tx/${txHash}`, id);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (err) {
      sendError(err);
    }
  }
}

export default CommunityService;
