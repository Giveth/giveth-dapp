import BigNumber from 'bignumber.js';

import { paramsForServer } from 'feathers-hooks-common';
import { LiquidPledging } from 'giveth-liquidpledging';
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
   * Get the user's Communities
   *
   * @param userAddress   Address of the user whose Community list should be retrieved
   * @param skipPages     Amount of pages to skip
   * @param itemsPerPage  Items to retrieve
   * @param onSuccess     Callback function once response is obtained successfully
   * @param onError       Callback function if error is encountered
   * @param subscribe
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
      return communities
        .watch({ listStrategy: 'always' })
        .find(query)
        .subscribe(resp => {
          const newResp = {
            ...resp,
            data: resp.data.map(d => new Community(d)),
          };
          onSuccess(newResp);
        }, onError);
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
   * @param web3
   */
  static async save(community, from, afterSave = () => {}, afterMined = () => {}, web3) {
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
        }. View transaction ${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`;
        console.log('Something went wrong with the Community create/update', err);
      }
      ErrorHandler(err, message, showMessageInPopup);
    };
    try {
      // upload Community info to IPFS
      let ipfsHash;
      try {
        ipfsHash = await IPFSService.upload(community.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload Community to IPFS');
      }

      const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);

      // nothing to update or failed ipfs upload
      if (community.delegateId && (community.url === ipfsHash || !ipfsHash)) {
        let response;
        // ipfs upload may have failed, but we still want to update feathers
        if (!ipfsHash) {
          response = await communities.patch(community.id, community.toFeathers(txHash));
        }
        afterSave({ response: response || community });
        afterMined(false);
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

      await promise.once('transactionHash', async hash => {
        txHash = hash;
        try {
          let response;
          if (community.id) {
            response = await communities.patch(community.id, community.toFeathers(txHash));
          } else {
            response = await communities.create(community.toFeathers(txHash));
          }
          afterSave({
            txUrl: `${etherScanUrl}tx/${txHash}`,
            response,
          });
        } catch (err) {
          ErrorHandler(err, 'Something went wrong.');
          afterSave({ err });
        }
      });

      afterMined(`${etherScanUrl}tx/${txHash}`);
    } catch (err) {
      sendError(err);
      afterSave({ err });
    }
  }
}

export default CommunityService;
