import LPPDac from 'lpp-dac';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import { feathersClient } from '../lib/feathersClient';
import { displayTransactionError } from '../lib/helpers';
import DAC from '../models/DAC';

class DACservice {
  /**
   * Get a DAC defined by ID
   *
   * @param id   ID of the DAC to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      feathersClient.service('dacs').find({ query: { _id: id } })
        .then((resp) => { resolve(new DAC(resp.data[0])); })
        .catch(err => reject(err));
    });
  }

  /**
   * Lazy-load DACs by subscribing to DACs listener
   *
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static subscribe(onSuccess, onError) {
    feathersClient.service('dacs').watch({ strategy: 'always' }).find({
      query: {
        delegateId: {
          $gt: '0', // 0 is a pending dac
        },
        $limit: 200,
        $sort: { campaignsCount: -1 },
      },
    }).subscribe(
      (resp) => {
        resp.data = resp.data.map(d => new DAC(d));
        onSuccess(resp);
      },
      onError,
    );
  }

  /**
   * Lazy-load DAC Donations by subscribing to donations listener
   *
   * @param id        ID of the DAC which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static subscribeDonations(id, onSuccess, onError) {
    return feathersClient.service('donations/history').watch({ listStrategy: 'always' }).find({
      query: {
        delegateId: id,
        $sort: { createdAt: -1 },
      },
    }).subscribe(
      resp => onSuccess(resp.data),
      onError,
    );
  }

  /**
   * Lazy-load DAC Campaigns by subscribing to campaigns listener
   *
   * @param id        ID of the DAC which campaigns should be retrieved
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static subscribeCampaigns(id, onSuccess, onError) {
    return feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
      query: {
        projectId: {
          $gt: '0', // 0 is a pending campaign
        },
        dacs: id,
        $limit: 200,
      },
    }).subscribe(
      (resp) => { onSuccess(resp.data); },
      onError,
    );
  }

  /**
   * Get the user's delegation
   *
   * @param userAddress Address of the user whose donations should be retrieved
   *
   * @return New promise with
   */
  static getUserDACs(userAddress) {
    return new Promise((resolve, reject) => {
      feathersClient.service('dacs').find({ query: { ownerAddress: userAddress } })
        .then(resp => resolve(resp.data.map(dac => new DAC(dac))))
        .catch(err => reject(err));
    });
  }

  /**
   * Save new DAC to the blockchain or update existing one in feathers
   *
   * @param dac         DAC object to be saved
   * @param afterCreate Callback to be triggered after the DAC is created in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static save(dac, afterCreate = () => {}, afterMined = () => {}) {
    if (dac.id) {
      feathersClient.service('dacs').patch(dac.id, dac.toFeathers())
        .then(() => afterMined());
    } else {
      let txHash;
      let etherScanUrl;
      Promise.all([getNetwork(), getWeb3()])
        .then(([network, web3]) => {
          const { liquidPledging } = network;
          etherScanUrl = network.etherscan;

          LPPDac.new(web3, liquidPledging.$address, dac.title, '', 0, dac.tokenName, dac.tokenSymbol)
            .once('transactionHash', (hash) => {
              txHash = hash;
              dac.txHash = txHash;
              feathersClient.service('dacs').create(dac.toFeathers())
                .then(() => afterCreate(`${etherScanUrl}tx/${txHash}`));
            })
            .then(() => {
              afterMined(`${etherScanUrl}tx/${txHash}`);
            });
        })
        .catch((err) => {
          console.log('New DAC transaction failed:', err); // eslint-disable-line no-console
          displayTransactionError(txHash, etherScanUrl);
        });
    }
  }
}

export default DACservice;
