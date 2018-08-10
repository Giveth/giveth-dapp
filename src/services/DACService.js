import BigNumber from 'bignumber.js';

import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import DAC from '../models/DAC';
import Campaign from '../models/Campaign';
import Donation from '../models/Donation';

import ErrorPopup from '../components/ErrorPopup';

BigNumber.config({ DECIMAL_PLACES: 18 });

class DACService {
  /**
   * Get a DAC defined by ID
   *
   * @param id   ID of the DAC to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      feathersClient
        .service('dacs')
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
   * Lazy-load DACs by subscribing to DACs listener
   *
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribe(onSuccess, onError) {
    return feathersClient
      .service('dacs')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          status: DAC.ACTIVE,
          $limit: 200,
          $sort: { campaignsCount: -1 },
        },
      })
      .subscribe(resp => {
        const newResp = Object.assign({}, resp, {
          data: resp.data.map(d => new DAC(d)),
        });
        onSuccess(newResp);
      }, onError);
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
   * Lazy-load DAC Donations by subscribing to donations listener
   *
   * @param id        ID of the DAC which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribeDonations(id, onSuccess, onError) {
    return feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          delegateTypeId: id,
          isReturn: false,
          intendedProjectId: { $exists: false },
          $sort: { createdAt: -1 },
        },
      })
      .subscribe(resp => onSuccess(resp.data.map(d => new Donation(d))), onError);
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
    return feathersClient
      .service('dacs')
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
        const newResp = Object.assign({}, resp, {
          data: resp.data.map(d => new DAC(d)),
        });
        onSuccess(newResp);
      }, onError);
  }

  /**
   * Save new DAC to the blockchain or update existing one in feathers
   *
   * @param dac         DAC object to be saved
   * @param from        address of the user creating the DAC
   * @param afterCreate Callback to be triggered after the DAC is created in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static save(dac, from, afterCreate = () => {}, afterMined = () => {}) {
    if (dac.id) {
      feathersClient
        .service('dacs')
        .patch(dac.id, dac.toFeathers())
        .then(() => afterMined());
    } else {
      let txHash;
      let etherScanUrl;
      getNetwork()
        .then(network => {
          const { liquidPledging } = network;
          etherScanUrl = network.etherscan;

          liquidPledging
            .addDelegate(dac.title, '', 0, 0, {
              from,
            })
            .once('transactionHash', hash => {
              txHash = hash;
              feathersClient
                .service('dacs')
                .create(dac.toFeathers(txHash))
                .then(id => afterCreate(`${etherScanUrl}tx/${txHash}`, id));
            })
            .then(() => {
              afterMined(`${etherScanUrl}tx/${txHash}`);
            });
        })
        .catch(err => {
          if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
          ErrorPopup(
            'Something went wrong with the DAC creation. Is your wallet unlocked?',
            `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
          );
        });
    }
  }
}

export default DACService;
