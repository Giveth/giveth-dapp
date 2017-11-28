import { LPPCampaignFactory } from 'lpp-campaign';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import { feathersClient } from '../lib/feathersClient';
import { displayTransactionError } from '../lib/helpers';
import Campaign from '../models/Campaign';

class CampaignService {
  /**
   * Get a Campaign defined by ID
   *
   * @param id   ID of the Campaign to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      feathersClient.service('campaigns').find({ query: { _id: id } })
        .then((resp) => { resolve(new Campaign(resp.data[0])); })
        .catch(reject);
    });
  }

  /**
   * Save new Campaign to the blockchain or update existing one in feathers
   *
   * @param campaign    Campaign object to be saved
   * @param from        Address of the user creating the Campaign
   * @param afterCreate Callback to be triggered after the Campaign is created in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static save(campaign, from, afterCreate = () => {}, afterMined = () => {}) {
    if (campaign.id) {
      feathersClient.service('campaigns').patch(campaign.id, campaign.toFeathers())
        .then(() => afterMined());
    } else {
      let txHash;
      let etherScanUrl;
      Promise.all([getNetwork(), getWeb3()])
        .then(([network, web3]) => {
          const { liquidPledging } = network;
          etherScanUrl = network.etherscan;

          new LPPCampaignFactory(web3, network.campaignFactoryAddress)
            .deploy(
              liquidPledging.$address, campaign.title, '', 0, campaign.reviewerAddress,
              campaign.tokenName, campaign.tokenSymbol, { from },
            )
            .once('transactionHash', (hash) => {
              txHash = hash;
              campaign.txHash = txHash;
              feathersClient.service('campaigns').create(campaign.toFeathers())
                .then(() => afterCreate(`${etherScanUrl}tx/${txHash}`));
            })
            .then(() => {
              afterMined(`${etherScanUrl}tx/${txHash}`);
            });
        })
        .catch((err) => {
          console.log('New Campaign transaction failed:', err); // eslint-disable-line no-console
          displayTransactionError(txHash, etherScanUrl);
        });
    }
  }
}

export default CampaignService;
