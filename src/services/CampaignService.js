import { LPPCampaign } from 'lpp-campaign';
import { paramsForServer } from 'feathers-hooks-common';
import Milestone from '../models/Milestone';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import extraGas from '../lib/blockchain/extraGas';
import { feathersClient } from '../lib/feathersClient';
import Campaign from '../models/Campaign';
import Donation from '../models/Donation';
import IPFSService from './IPFSService';
import ErrorPopup from '../components/ErrorPopup';

const campaigns = feathersClient.service('campaigns');

class CampaignService {
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
          resolve(new Campaign(resp.data[0]));
        })
        .catch(reject);
    });
  }

  /**
   * Get Campaigns
   *
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amounds of record to be skipped
   * @param onSuccess Callback function once response is obtained successfylly
   * @param onError   Callback function if error is encountered
   */
  static getCampaigns($limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('campaigns')
      .find({
        query: {
          projectId: { $gt: 0 }, // 0 is a pending campaign
          status: Campaign.ACTIVE,
          $limit,
          $skip,
          // Should set a specific prop for "qualified" updates
          // Current impl will allow a campaign manager to be first
          // in the list by just editing the campaign
          $sort: { updatedAt: -1 },
        },
      })
      .then(resp => {
        onSuccess(
          resp.data.map(c => new Campaign(c)),
          resp.total,
        );
      })
      .catch(onError);
  }

  /**
   * Get Campaign milestones listener
   *
   * @param id        ID of the Campaign which donations should be retrieved
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amounds of record to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static getMilestones(id, $limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('milestones')
      .find({
        query: {
          campaignId: id,
          status: {
            $nin: [Milestone.CANCELED, Milestone.PROPOSED, Milestone.REJECTED, Milestone.PENDING],
          },
          $sort: { projectAddedAt: -1 },
          $limit,
          $skip,
        },
      })
      .then(resp => ({
        ...resp,
        data: resp.data.filter(
          milestone =>
            !(milestone.donationCounters.length <= 0 && milestone.status === Milestone.COMPLETED),
        ),
      }))
      .then(resp =>
        onSuccess(
          resp.data.map(m => new Milestone(m)),
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
            $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
            ownerTypeId: id,
            isReturn: false,
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
            $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
            ownerTypeId: id,
            isReturn: false,
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
   * Get the user's Campaigns
   *
   * @param userAddress Address of the user whose Campaign list should be retrieved
   * @param skipPages     Amount of pages to skip
   * @param itemsPerPage  Items to retreive
   * @param onSuccess   Callback function once response is obtained successfully
   * @param onError     Callback function if error is encountered
   */
  static getUserCampaigns(userAddress, skipPages, itemsPerPage, onSuccess, onError) {
    return campaigns
      .watch({ listStrategy: 'always' })
      .find({
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
      })
      .subscribe(resp => {
        const newResp = { ...resp, data: resp.data.map(c => new Campaign(c)) };
        onSuccess(newResp);
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
   */
  static async save(campaign, from, afterSave = () => {}, afterMined = () => {}) {
    if (campaign.id && campaign.projectId === 0) {
      throw new Error(
        'You must wait for your Campaign to be creation to finish before you can update it',
      );
    }

    let txHash;
    let etherScanUrl;
    try {
      let profileHash;
      try {
        profileHash = await IPFSService.upload(campaign.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload campaign to ipfs');
      }

      const network = await getNetwork();
      etherScanUrl = network.etherscan;

      // nothing to update or failed ipfs upload
      if (campaign.projectId && (campaign.url === profileHash || !profileHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!profileHash) {
          await campaigns.patch(campaign.id, campaign.toFeathers(txHash));
        }
        afterSave(null, false);
        afterMined(false, undefined, campaign.id);
        return;
      }

      let promise;
      if (campaign.projectId) {
        // LPPCampaign function update(string newName, string newUrl, uint64 newCommitTime)
        promise = new LPPCampaign(await getWeb3(), campaign.pluginAddress).update(
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
        const { lppCampaignFactory } = network;
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
        if (campaign.id) await campaigns.patch(campaign.id, campaign.toFeathers(txHash));
        else id = (await campaigns.create(campaign.toFeathers(txHash)))._id;
        afterSave(null, !campaign.projectId, `${etherScanUrl}tx/${txHash}`);
      });

      afterMined(!campaign.projectId, `${etherScanUrl}tx/${txHash}`, id);
    } catch (err) {
      ErrorPopup(
        `Something went wrong with the Campaign ${
          campaign.projectId > 0 ? 'update' : 'creation'
        }. Is your wallet unlocked?`,
        `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
      );
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
    Promise.all([getNetwork(), getWeb3()])
      .then(([_]) => {
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
      })
      .catch(err => {
        ErrorPopup('Something went wrong with cancelling your campaign', err);
      });
  }

  /**
   * Change funds forwarder address on a campaign
   *
   * //TODO: update contact for transaction on this
   *
   * @param campaign    Campaign to be modified
   * @param address        Address of the funds forwarder
   */
  static addFundsForwarderAddress(
    campaignId,
    address,
    afterCreate = () => {},
    afterMined = () => {},
  ) {
    Promise.all([getNetwork(), getWeb3()])
      .then(([_]) => {
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
      })
      .catch(err => {
        ErrorPopup('Something went wrong with cancelling your campaign', err);
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
   */
  static cancel(campaign, from, afterCreate = () => {}, afterMined = () => {}) {
    let txHash;
    let etherScanUrl;
    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        const lppCampaign = new LPPCampaign(web3, campaign.pluginAddress);
        etherScanUrl = network.etherscan;

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
              .then(afterCreate(`${etherScanUrl}tx/${txHash}`))
              .catch(err => {
                ErrorPopup('Something went wrong with updating campaign', err);
              });
          })
          .then(() => afterMined(`${etherScanUrl}tx/${txHash}`))
          .catch(err => {
            if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
            ErrorPopup(
              'Something went wrong with cancelling your campaign',
              `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
            );
          });
      })
      .catch(err => {
        ErrorPopup(
          'Something went wrong with cancelling your campaign',
          `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
        );
      });
  }
}

export default CampaignService;
