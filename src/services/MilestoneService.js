/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */

import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { paramsForServer } from 'feathers-hooks-common';
import { LPPCappedMilestone } from 'lpp-capped-milestone';
import Milestone from 'models/Milestone';
import { feathersClient } from 'lib/feathersClient';
import getNetwork from 'lib/blockchain/getNetwork';
import getWeb3 from 'lib/blockchain/getWeb3';
import extraGas from 'lib/blockchain/extraGas';
import DonationService from 'services/DonationService';
import IPFSService from './IPFSService';
import ErrorPopup from '../components/ErrorPopup';

import Donation from '../models/Donation';

const milestones = feathersClient.service('milestones');

BigNumber.config({ DECIMAL_PLACES: 18 });

class MilestoneService {
  constructor() {
    this.milestoneSubscription = null;
  }

  /**
   * Get a Milestone defined by ID
   *
   * @param id   ID of the Milestone to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      milestones
        .find({ query: { _id: id } })
        .then(resp => {
          resolve(new Milestone(resp.data[0]));
        })
        .catch(reject);
    });
  }

  /**
   * Subscribe to a Milestone defined by ID
   *
   * @param id   ID of the Milestone to be retrieved
   */
  static subscribeOne(id, onResult, onError) {
    this.milestoneSubscription = milestones
      .watch({ listStrategy: 'always' })
      .find({ query: { _id: id } })
      .subscribe(resp => {
        onResult(new Milestone(resp.data[0]));
      }, onError);
    return this.milestoneSubscription;
  }

  /**
   * Lazy-load Milestones by subscribing to Milestone listener
   *
   * @param milestoneStatus   any of the Milestone model statuses
   * @param ownerAddress      ethereum address of the owner
   * @param recipientAddress  ethereum address of the recipient
   * @param skipPages         paging: the current page
   * @param itemsPerPage      paging: amount of items per page
   *
   * returns a Promise
   *  resolve:
   *    Object
   *      data                (Array) Milestone models
   *      limit               (Number) items per page
   *      skipped             (Number) pages skipped
   *      totalResults        (Number) total results
   *
   *  reject:
   *    error message
   */
  static async subscribeMyMilestones({
    milestoneStatus,
    ownerAddress,
    recipientAddress,
    skipPages,
    itemsPerPage,
    onResult,
    onError,
  }) {
    const query = {
      $sort: {
        createdAt: -1,
      },
      $limit: itemsPerPage,
      $skip: skipPages * itemsPerPage,
    };

    if ([Milestone.CANCELED, Milestone.PAID].includes(milestoneStatus)) {
      query.$and = [
        {
          $or: [
            { ownerAddress },
            // { reviewerAddress: myAddress }, // Not really "My Milestones"
            { recipientAddress },
          ],
        },
        { status: milestoneStatus },
      ];
    } else if (milestoneStatus === Milestone.REJECTED) {
      query.$and = [
        {
          $or: [
            { ownerAddress },
            // { reviewerAddress: myAddress }, // Not really "My Milestones"
            { recipientAddress },
          ],
        },
        { status: Milestone.REJECTED },
      ];
    } else {
      const resp = await feathersClient.service('campaigns').find({
        query: {
          ownerAddress,
          $select: ['_id'],
        },
      });

      query.$and = [
        {
          $or: [
            { ownerAddress },
            { reviewerAddress: ownerAddress },
            { recipientAddress: ownerAddress },
            {
              $and: [
                { campaignId: { $in: resp.data.map(c => c._id) } },
                { status: Milestone.PROPOSED },
              ],
            },
          ],
        },
        { status: { $nin: [Milestone.PAID, Milestone.CANCELED, Milestone.REJECTED] } },
      ];
    }

    this.subscribe(query, onResult, onError);
  }

  /**
   * Lazy-load Milestones by subscribing to Milestone listener
   *
   * @param query     A feathers query
   *
   * returns a Promise
   *  resolve:
   *    Object
   *      data                (Array) Milestone models
   *      limit               (Number) items per page
   *      skipped             (Number) pages skipped
   *      totalResults        (Number) total results
   *
   *  reject:
   *    error message
   */

  static subscribe(query, onResult, onError) {
    this.milestoneSubscription = milestones
      .watch({ listStrategy: 'always' })
      .find({ query })
      .subscribe(
        resp => {
          try {
            onResult(
              Object.assign({}, resp, {
                data: resp.data.map(m => new Milestone(m)),
              }),
            );
          } catch (e) {
            onError(e);
          }
        },

        onError,
      );
  }

  /**
   * Unsubscribe from Milestone listener
   */

  static unsubscribe() {
    if (this.milestoneSubscription) this.milestoneSubscription.unsubscribe();
  }

  /**
   * Get Active Milestones sorted by created date
   *
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amounds of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static getActiveMilestones($limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('milestones')
      .find({
        query: {
          status: Milestone.IN_PROGRESS,
          $sort: { createdAt: -1 },
          $limit,
          $skip,
        },
      })
      .then(resp => onSuccess(resp.data.map(m => new Milestone(m)), resp.total))
      .catch(onError);
  }

  /**
   * Get Milestone donations
   *
   * @param id        ID of the Milestone which donations should be retrieved
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
            amountRemaining: { $ne: 0 },
            status: { $ne: Donation.FAILED },
            $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
            $sort: { usdValue: -1, createdAt: -1 },
            $limit,
            $skip,
          },
          schema: 'includeTypeAndGiverDetails',
        }),
      )
      .then(resp => onSuccess(resp.data.map(d => new Donation(d)), resp.total))
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
            amountRemaining: { $ne: 0 },
            status: { $ne: Donation.FAILED },
            $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
            $sort: { createdAt: -1 },
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
   * Save new Milestone to the blockchain or update existing one in feathers
   * TODO: Handle error states properly
   *
   * @param milestone   Milestone object to be saved
   * @param from        address of the user saving the Milestone
   * @param afterSave   Callback to be triggered after the Milestone is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static async save({
    milestone,
    from,
    afterSave = () => {},
    afterMined = () => {},
    onError = () => {},
  }) {
    if (milestone.id && milestone.projectId === 0) {
      return onError(
        'You must wait for your Milestone creation to finish before you can update it',
      );
    }

    if (!milestone.parentProjectId || milestone.parentProjectId === '0') {
      return onError(
        `It looks like the campaign has not been mined yet. Please try again in a bit`,
      );
    }

    let txHash;
    let etherScanUrl;

    try {
      // if a proposed or rejected milestone, create it only in feathers
      if ([Milestone.PROPOSED, Milestone.REJECTED].includes(milestone.status)) {
        await milestones.create(milestone.toFeathers());
        afterSave(true);
        return true;
      }

      // upload new milestone image
      if (milestone.newImage || (milestone.image && milestone.image.includes('data:image'))) {
        try {
          milestone.image = await IPFSService.upload(milestone.image);
          milestone.newImage = false;
        } catch (err) {
          ErrorPopup('Failed to upload milestone image to ipfs');
        }
      }

      // upload new milestone item images for new milestones
      if (milestone.itemizeState) {
        for (const milestoneItem of milestone.items) {
          if (
            milestoneItem.newImage ||
            (milestoneItem.image && milestoneItem.image.includes('data:image'))
          ) {
            try {
              milestoneItem.image = await IPFSService.upload(milestoneItem.image);
              milestoneItem.newImage = false;
            } catch (err) {
              ErrorPopup('Failed to upload milestone item to ipfs');
            }
          }
        }
      }

      let profileHash;
      try {
        profileHash = await IPFSService.upload(milestone.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload milestone to ipfs');
      }

      // nothing to update or failed ipfs upload
      if (milestone.projectId && (milestone.url === profileHash || !profileHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!profileHash) {
          await milestones.patch(milestone._id, milestone.toFeathers());
        }
        afterSave(null, false);
        return true;
      }

      const network = await getNetwork();
      etherScanUrl = network.etherScanUrl;

      let tx;
      if (milestone.projectId) {
        // TODO: current milestone has no update function
        // // LPPCampaign function update(string newName, string newUrl, uint64 newCommitTime)
        // tx = new LPP(await getWeb3(), campaign.pluginAddress).update(
        //   campaign.title,
        //   profileHash || '',
        //   0,
        //   {
        //     from,
        //     $extraGas: extraGas(),
        //   },
        // );
      } else {
        /**
          Create a milestone on chain

          lppCappedMilestoneFactory params

          string _name,
          string _url,
          uint64 _parentProject,
          address _reviewer,
          address _recipient,
          address _campaignReviewer,
          address _milestoneManager,
          uint _maxAmount,
          address _acceptedToken,
          uint _reviewTimeoutSeconds
        * */
        const { lppCappedMilestoneFactory } = network;

        tx = lppCappedMilestoneFactory.newMilestone(
          milestone.title,
          profileHash || '',
          milestone.parentProjectId,
          milestone.reviewerAddress,
          milestone.recipientAddress,
          milestone.campaignReviewerAddress,
          from,
          utils.toWei(milestone.maxAmount.toFixed()),
          milestone.token.address,
          5 * 24 * 60 * 60, // 5 days in seconds
          { from, $extraGas: extraGas() },
        );
      }

      let milestoneId;
      await tx.once('transactionHash', async hash => {
        txHash = hash;

        // create milestone in feathers
        // if (milestone.id) await milestones.patch(milestone.id, milestone.toFeathers(txHash));
        milestoneId = await milestones.create(milestone.toFeathers(txHash))._id;
        afterSave(false, !milestone.projectId, `${etherScanUrl}tx/${txHash}`);
      });

      afterMined(!milestone.projectId, `${etherScanUrl}tx/${txHash}`, milestoneId);
    } catch (err) {
      ErrorPopup(
        `Something went wrong with the Milestone ${
          milestone.projectId > 0 ? 'update' : 'creation'
        }. Is your wallet unlocked?`,
        `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
      );
      onError(err.message);
    }

    return true;
  }

  /**
   * Delete a proposed milestone
   *
   * @param milestone   a Milestone model
   * @param onSuccess   Callback function once response is obtained successfully
   * @param onError     Callback function if error is encountered
   */
  static deleteProposedMilestone({ milestone, onSuccess, onError }) {
    milestones
      .remove(milestone._id)
      .then(() => onSuccess())
      .catch(e => onError(e));
  }

  /**
   * Reject a proposed milestone
   *
   * @param milestone       a Milestone model
   * @param rejectReason    (string, optional) message why the milestone is rejected
   * @param onSuccess       Callback function once response is obtained successfully
   * @param onError         Callback function if error is encountered
   */
  static rejectProposedMilestone({ milestone, rejectReason, onSuccess, onError }) {
    const reject = { status: 'Rejected' };
    if (rejectReason) reject.message = rejectReason;
    milestones
      .patch(milestone._id, reject)
      .then(() => onSuccess())
      .catch(e => onError(e));
  }

  /**
   * Accept a proposed milestone
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the milestone was accepted
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */
  static acceptProposedMilestone({ milestone, from, proof, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    getNetwork()
      .then(network => {
        etherScanUrl = network.etherscan;

        const {
          title,
          maxAmount,
          recipientAddress,
          reviewerAddress,
          owner, // TODO change this to managerAddress. There is no owner
          campaignReviewer,
          token,
        } = milestone;
        const parentProjectId = milestone.campaign.projectId;

        // TODO fix this hack
        if (!parentProjectId || parentProjectId === '0') {
          throw new Error('campaign-not-mined');
        }

        network.lppCappedMilestoneFactory
          .newMilestone(
            title,
            '',
            parentProjectId,
            reviewerAddress,
            recipientAddress,
            campaignReviewer.address,
            owner.address,
            utils.toWei(maxAmount.toFixed()),
            token.foreignAddress,
            5 * 24 * 60 * 60, // 5 days in seconds
            { from, $extraGas: extraGas() },
          )
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.PENDING,
                mined: false,
                message: proof.message,
                proofItems: proof.items,
                txHash,
              })
              .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
              .catch(e => onError('patch-error', e));
          })
          .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`));
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Repropose a proposed milestone that has been rejected
   *
   * @param milestone       a Milestone model
   * @param proof           A proof object:
        message               Reason why the milestone was reproposed
        items                 Attached proof
   * @param onSuccess       Callback function once response is obtained successfully
   * @param onError         Callback function if error is encountered
   */
  static reproposeRejectedMilestone({ milestone, proof, onSuccess, onError }) {
    milestones
      .patch(milestone._id, {
        status: Milestone.PROPOSED,
        message: proof.message,
        proofItems: proof.proofItems,
      })
      .then(() => onSuccess())
      .catch(e => onError(e));
  }

  /**
   * Request a milestone to be marked as complete
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the milestone is marked as complete
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */
  static async requestMarkComplete({ milestone, from, proof, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    try {
      const network = await getNetwork();
      const web3 = await getWeb3();

      etherScanUrl = network.etherscan;

      const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

      await cappedMilestone
        .requestMarkAsComplete({
          from,
          $extraGas: extraGas(),
        })
        .once('transactionHash', async hash => {
          txHash = hash;

          if (proof.items && proof.items.length > 0) {
            for (const proofItem of proof.items) {
              try {
                proofItem.image = await IPFSService.upload(proofItem.image);
              } catch (err) {
                ErrorPopup('Failed to upload milestone proof item image to ipfs', err);
              }
            }
          }

          try {
            await milestones.patch(milestone._id, {
              status: Milestone.NEEDS_REVIEW,
              message: proof.message,
              proofItems: proof.items.map(i => i.toFeathers()),
              mined: false,
              txHash,
            });
          } catch (err) {
            throw new Error('patch-error', err);
          }

          onTxHash(`${etherScanUrl}tx/${txHash}`);
        })
        .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`));
    } catch (err) {
      if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
      onError(err, `${etherScanUrl}tx/${txHash}`);
    }
  }

  /**
   * Cancel a milestone
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the milestone is canceled
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */

  static cancelMilestone({ milestone, from, proof, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        etherScanUrl = network.etherscan;

        const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

        return cappedMilestone
          .cancelMilestone({
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.CANCELED,
                message: proof.message,
                proofItems: proof.items,
                mined: false,
                txHash,
              })
              .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
              .catch(e => onError('patch-error', e));
          })
          .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`));
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Approve the completion of a milestone (after the milestone has been requested as complete)
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the milestone is approved for completion
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */

  static approveMilestoneCompletion({ milestone, from, proof, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        etherScanUrl = network.etherscan;

        const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

        return cappedMilestone
          .approveMilestoneCompleted({
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.COMPLETED,
                mined: false,
                message: proof.message,
                proofItems: proof.items,
                txHash,
              })
              .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
              .catch(e => onError('patch-error', e));
          })
          .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`));
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Reject the completion of a milestone (after the milestone has been requested as complete)
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the milestone is rejected for completion
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */

  static rejectMilestoneCompletion({ milestone, from, proof, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        etherScanUrl = network.etherscan;

        const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

        return cappedMilestone
          .rejectCompleteRequest({
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.IN_PROGRESS,
                mined: false,
                message: proof.message,
                proofItems: proof.items,
                txHash,
              })
              .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
              .catch(e => onError('patch-error', e));
          })
          .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`));
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Withdraw the donations (pledges) from a milestone
   * Only possible when the milestones was approved for completion
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */

  static withdraw({ milestone, from, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3(), DonationService.getMilestoneDonations(milestone._id)])
      .then(([network, web3, data]) => {
        etherScanUrl = network.etherscan;

        const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

        return cappedMilestone
          .mWithdraw(data.pledges, {
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            DonationService.updateSpentDonations(data.donations)
              .then(() => {
                if (!data.hasMoreDonations) {
                  milestones
                    .patch(milestone._id, {
                      status: Milestone.PAYING,
                      mined: false,
                      txHash,
                    })
                    .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`));
                  return;
                }
                onTxHash(`${etherScanUrl}tx/${txHash}`);
              })
              .catch(e => {
                if (e && e.name !== 'NotAuthenticated') onError('patch-error', e);
              });
          })
          .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`))
          .catch(err => onError(err));
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }
}

export default MilestoneService;
