import BigNumber from 'bignumber.js';

import { paramsForServer } from 'feathers-hooks-common';
import getNetwork from '../lib/blockchain/getNetwork';
import extraGas from '../lib/blockchain/extraGas';
import { feathersClient } from '../lib/feathersClient';
import DAC from '../models/DAC';
import Campaign from '../models/Campaign';
import Donation from '../models/Donation';
import IPFSService from './IPFSService';

import ErrorPopup from '../components/ErrorPopup';
import { ZERO_ADDRESS } from '../lib/helpers';

BigNumber.config({ DECIMAL_PLACES: 18 });

const dacs = feathersClient.service('dacs');

class DACService {
  /**
   * Get a DAC defined by ID
   *
   * @param id   ID of the DAC to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      dacs
        .find({
          query: {
            _id: id,
          },
        })
        .then(resp => {
          resolve(new DAC(resp.data[0]));
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Get a DAC defined by Delegate ID
   *
   *  @param delegateId Delegate Id of the DAC to be retrieved
   */
  static getByDelegateId(delegateId) {
    return new Promise((resolve, reject) => {
      dacs
        .find({
          query: {
            delegateId,
          },
        })
        .then(resp => {
          if (resp.total === 0) resolve(undefined);
          else resolve(new DAC(resp.data[0]));
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Get DACs
   *
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amounds of record to be skipped
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static getDACs($limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('dacs')
      .find({
        query: {
          status: DAC.ACTIVE,
          $limit,
          $skip,
          $sort: { campaignsCount: -1 },
        },
      })
      .then(resp =>
        onSuccess(
          resp.data.map(d => new DAC(d)),
          resp.total,
        ),
      )
      .catch(onError);
  }

  /**
   * Lazy-load DAC Campaigns by subscribing to campaigns listener
   *
   * @param delegateId Dekegate ID of the DAC which campaigns should be retrieved
   * @param onSuccess  Callback function once response is obtained successfylly
   * @param onError    Callback function if error is encountered
   */
  static subscribeCampaigns(delegateId, onSuccess, onError) {
    return feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          $select: ['delegateId', 'intendedProjectId', 'amount'],
          delegateId,
          $limit: 200,
        },
      })
      .subscribe(async resp => {
        const projectIDs = {};
        resp.data.forEach(d => {
          if (d.intendedProjectId && d.amount) {
            projectIDs[d.intendedProjectId] = (
              projectIDs[d.intendedProjectId] || new BigNumber(0)
            ).plus(new BigNumber(d.amount));
          }
        });

        const campaignsResp = await feathersClient.service('campaigns').find({
          query: {
            projectId: { $in: Object.keys(projectIDs) },
            $limit: 200,
          },
        });

        const campaigns = campaignsResp.data.map(d => new Campaign(d));
        onSuccess(campaigns);
      }, onError);
  }

  /**
   * Get DAC donations
   *
   * @param id        ID of the DAC which donations should be retrieved
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
    let initalTotal;
    return feathersClient
      .service('donations')
      .watch()
      .find(
        paramsForServer({
          query: {
            status: { $ne: Donation.FAILED },
            delegateTypeId: id,
            isReturn: false,
            intendedProjectId: { $exists: false },
            $sort: { usdValue: -1, createdAt: -1 },
            $limit: 0,
          },
          schema: 'includeTypeAndGiverDetails',
        }),
      )
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
   * Get the user's DACs
   *
   * @param userAddress   Address of the user whose DAC list should be retrieved
   * @param skipPages     Amount of pages to skip
   * @param itemsPerPage  Items to retreive
   * @param onSuccess     Callback function once response is obtained successfully
   * @param onError       Callback function if error is encountered
   */
  static getUserDACs(userAddress, skipPages, itemsPerPage, onSuccess, onError) {
    return dacs
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          ownerAddress: userAddress,
          $sort: {
            createdAt: -1,
          },
          $limit: itemsPerPage,
          $skip: skipPages * itemsPerPage,
        },
      })
      .subscribe(resp => {
        const newResp = { ...resp, data: resp.data.map(d => new DAC(d)) };
        onSuccess(newResp);
      }, onError);
  }

  /**
   * Save new DAC to the blockchain or update existing one in feathers
   *
   * @param dac         DAC object to be saved
   * @param from        address of the user creating the DAC
   * @param afterSave   Callback to be triggered after the DAC is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static async save(dac, from, afterSave = () => {}, afterMined = () => {}) {
    if (dac.id && dac.delegateId === 0) {
      throw new Error(
        'You must wait for your DAC to be creation to finish before you can update it',
      );
    }

    let txHash;
    let etherScanUrl;
    try {
      // upload DAC info to IPFS
      let ipfsHash;
      try {
        ipfsHash = await IPFSService.upload(dac.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload DAC to IPFS');
      }

      const network = await getNetwork();
      etherScanUrl = network.etherscan;
      const { liquidPledging } = network;

      // nothing to update or failed ipfs upload
      if (dac.delegateId && (dac.url === ipfsHash || !ipfsHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!ipfsHash) {
          await dacs.patch(dac.id, dac.toFeathers(txHash));
        }
        afterSave(null, false);
        afterMined(false, undefined, dac.id);
        return;
      }

      // lp function updateDelegate(uint64 idDelegate,address newAddr,string newName,string newUrl,uint64 newCommitTime)
      // lp function addDelegate(string name,string url,uint64 commitTime,address plugin)
      const promise = dac.delegateId
        ? liquidPledging.updateDelegate(
            dac.delegateId,
            dac.ownerAddress,
            dac.title,
            ipfsHash || '',
            dac.commitTime,
            { from, $extraGas: extraGas() },
          )
        : liquidPledging.addDelegate(dac.title, ipfsHash || '', 0, ZERO_ADDRESS, {
            from,
            $extraGas: extraGas(),
          });

      let { id } = dac;
      await promise.once('transactionHash', async hash => {
        txHash = hash;
        if (dac.id) await dacs.patch(dac.id, dac.toFeathers(txHash));
        else id = (await dacs.create(dac.toFeathers(txHash)))._id;
        afterSave(null, !dac.delegateId, `${etherScanUrl}tx/${txHash}`);
      });

      afterMined(!dac.delegateId, `${etherScanUrl}tx/${txHash}`, id);
    } catch (err) {
      ErrorPopup(
        `Something went wrong with the DAC ${
          dac.delegateId > 0 ? 'update' : 'creation'
        }. Is your wallet unlocked?`,
        `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
      );
      afterSave(err);
    }
  }
}

export default DACService;
