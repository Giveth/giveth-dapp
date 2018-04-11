import { LPPCampaignFactory, LPPCampaign } from 'lpp-campaign';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import { feathersClient } from '../lib/feathersClient';
import { displayTransactionError, getGasPrice } from '../lib/helpers';
import Campaign from '../models/Campaign';

class CampaignService {
  /**
   * Get a Campaign defined by ID
   *
   * @param id   ID of the Campaign to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      feathersClient
        .service('campaigns')
        .find({ query: { _id: id } })
        .then(resp => {
          resolve(new Campaign(resp.data[0]));
        })
        .catch(reject);
    });
  }

  /**
   * Lazy-load Campaigns by subscribing to Campaigns listener
   *
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static subscribe(onSuccess, onError) {
    return feathersClient
      .service('campaigns')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          projectId: {
            $gt: '0', // 0 is a pending campaign
          },
          status: Campaign.ACTIVE,
          $limit: 200,
          $sort: { milestonesCount: -1 },
        },
      })
      .subscribe(resp => {
        const newResp = Object.assign({}, resp, {
          data: resp.data.map(c => new Campaign(c)),
        });
        onSuccess(newResp);
      }, onError);
  }

  /**
   * Lazy-load Campaign milestones by subscribing to milestone listener
   *
   * @param id        ID of the Campaign which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribeMilestones(id, onSuccess, onError) {
    return feathersClient
      .service('milestones')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          campaignId: id,
          projectId: {
            $gt: '0', // 0 is a pending milestone
          },
          status: { $nin: ['Canceled'] },
          $sort: { createdAt: -1 },
        },
      })
      .subscribe(resp => onSuccess(resp.data), onError);
  }

  /**
   * Lazy-load Campaign donations by subscribing to donations listener
   *
   * @param id        ID of the Campaign which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribeDonations(id, onSuccess, onError) {
    return feathersClient
      .service('donations/history')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          ownerId: id,
          $sort: { createdAt: -1 },
        },
      })
      .subscribe(resp => onSuccess(resp.data), onError);
  }

  /**
   * Get the user's Campaigns
   *
   * @param userAddress Address of the user whose Campaign list should be retrieved
   * @param onSuccess   Callback function once response is obtained successfully
   * @param onError     Callback function if error is encountered
   */
  static getUserCampaigns(userAddress, onSuccess, onError) {
    return feathersClient
      .service('campaigns')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          $or: [{ ownerAddress: userAddress }, { reviewerAddress: userAddress }],
        },
      })
      .subscribe(
        resp => onSuccess(resp.data.map(campaign => new Campaign(campaign)).sort(Campaign.compare)),
        onError,
      );
  }

  /**
   * Save new Campaign to the blockchain or update existing one in feathers
   * TODO: Handle error states properly
   *
   * @param campaign    Campaign object to be saved
   * @param from        Address of the user creating the Campaign
   * @param afterCreate Callback to be triggered after the Campaign is created in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static save(campaign, from, afterCreate = () => {}, afterMined = () => {}) {
    if (campaign.id) {
      feathersClient
        .service('campaigns')
        .patch(campaign.id, campaign.toFeathers())
        .then(() => afterMined());
    } else {
      let txHash;
      let etherScanUrl;
      Promise.all([getNetwork(), getWeb3(), getGasPrice()])
        .then(([network, web3, gasPrice]) => {
          const { liquidPledging } = network;
          etherScanUrl = network.etherscan;

          new LPPCampaignFactory(web3, network.campaignFactoryAddress)
            .deploy(
              liquidPledging.$address,
              campaign.title,
              '',
              0,
              campaign.reviewerAddress,
              campaign.tokenName,
              campaign.tokenSymbol,
              from,
              from,
              { from, gasPrice },
            )
            .once('transactionHash', hash => {
              txHash = hash;
              campaign.txHash = txHash;
              feathersClient
                .service('campaigns')
                .create(campaign.toFeathers())
                .then(() => afterCreate(`${etherScanUrl}tx/${txHash}`));
            })
            .then(() => {
              afterMined(`${etherScanUrl}tx/${txHash}`);
            })
            .catch(err => {
              console.log('New Campaign transaction failed:', err); // eslint-disable-line no-console
              displayTransactionError(txHash, etherScanUrl);
            });
        })
        .catch(err => {
          console.log('New Campaign transaction failed:', err); // eslint-disable-line no-console
          displayTransactionError(txHash, etherScanUrl);
        });
    }
  }

  /**
   * Cancel Campaign in the blockchain and update it in feathers
   * TODO: Handle error states properly
   *
   * @param campaign    Campaign to be cancelled
   * @param from        Address of the user cancelling the Campaign
   * @param afterCreate Callback to be triggered after the Campaign is cancelled in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static cancel(campaign, from, afterCreate = () => {}, afterMined = () => {}) {
    let txHash;
    let etherScanUrl;
    Promise.all([getNetwork(), getWeb3(), getGasPrice()])
      .then(([network, web3, gasPrice]) => {
        const lppCampaign = new LPPCampaign(web3, campaign.pluginAddress);
        etherScanUrl = network.etherscan;

        lppCampaign
          .cancelCampaign({ from, gasPrice })
          .once('transactionHash', hash => {
            txHash = hash;
            feathersClient
              .service('/campaigns')
              .patch(campaign.id, {
                status: Campaign.CANCELED,
                mined: false,
                txHash,
              })
              .then(afterCreate(`${etherScanUrl}tx/${txHash}`))
              .catch(err => {
                console.log('Failed to update feathers:', err); // eslint-disable-line no-console
              });
          })
          .then(() => afterMined(`${etherScanUrl}tx/${txHash}`))
          .catch(err => {
            console.log('Cancel Campaign failed:', err); // eslint-disable-line no-console
            displayTransactionError(txHash, etherScanUrl);
          });
      })
      .catch(err => {
        console.log('Cancel Campaign failed:', err); // eslint-disable-line no-console
        displayTransactionError(txHash, etherScanUrl);
      });
  }
}

export default CampaignService;
