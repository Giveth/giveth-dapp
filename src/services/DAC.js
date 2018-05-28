import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import DAC from '../models/DAC';
import Campaign from '../models/Campaign';

import ErrorPopup from '../components/ErrorPopup';

class DACservice {
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
          delegateId: {
            $gt: '0', // 0 is a pending dac
          },
          // TODO: Re-enable once communities have status staved in feathers
          // status: DAC.ACTIVE,
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
          delegateId: id,
          $sort: { createdAt: -1 },
        },
      })
      .subscribe(resp => onSuccess(resp.data), onError);
  }

  /**
   * Lazy-load DAC Campaigns by subscribing to campaigns listener
   *
   * @param id        ID of the DAC which campaigns should be retrieved
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static subscribeCampaigns(id, onSuccess, onError) {
    return feathersClient
      .service('campaigns')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          projectId: {
            $gt: '0', // 0 is a pending campaign
          },
          dacs: id,
          $limit: 200,
        },
      })
      .subscribe(resp => {
        onSuccess(resp.data.map(c => new Campaign(c)));
      }, onError);
  }

  /**
   * Get the user's DACs
   *
   * @param userAddress Address of the user whose DAC list should be retrieved
   * @param onSuccess   Callback function once response is obtained successfully
   * @param onError     Callback function if error is encountered
   */
  static getUserDACs(userAddress, onSuccess, onError) {
    return feathersClient
      .service('dacs')
      .watch({ listStrategy: 'always' })
      .find({ query: { ownerAddress: userAddress } })
      .subscribe(resp => onSuccess(resp.data.map(dac => new DAC(dac))), onError);
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
          const { lppDacFactory } = network;
          etherScanUrl = network.etherscan;

          lppDacFactory
            .newDac(dac.title, '', 0, dac.tokenName, dac.tokenSymbol, from, from, {
              from,
            })
            .once('transactionHash', hash => {
              txHash = hash;
              dac.txHash = txHash;
              feathersClient
                .service('dacs')
                .create(dac.toFeathers())
                .then(() => afterCreate(`${etherScanUrl}tx/${txHash}`));
            })
            .then(() => {
              afterMined(`${etherScanUrl}tx/${txHash}`);
            });
        })
        .catch(err => {
          ErrorPopup(
            'Something went wrong with the DAC creation. Is your wallet unlocked?',
            `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
          );
        });
    }
  }
}

export default DACservice;
