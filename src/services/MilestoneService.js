/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */

import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { paramsForServer } from 'feathers-hooks-common';
import Milestone from 'models/Milestone';
import MilestoneFactory from 'models/MilestoneFactory';
import { feathersClient } from 'lib/feathersClient';
import getNetwork from 'lib/blockchain/getNetwork';
import getWeb3 from 'lib/blockchain/getWeb3';
import extraGas from 'lib/blockchain/extraGas';
import DonationService from 'services/DonationService';
import IPFSService from './IPFSService';
import ErrorPopup from '../components/ErrorPopup';

import Donation from '../models/Donation';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';
// import { getCutOffAmountWei } from '../lib/helpers';

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
          resolve(MilestoneFactory.create(resp.data[0]));
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
        const { total, data } = resp;
        if (total === 0) {
          onError(404);
          return;
        }
        onResult(MilestoneFactory.create(data[0]));
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
    coownerAddress,
    recipientAddress,
    skipPages,
    itemsPerPage,
    onResult,
    onError,
  }) {
    const query = {
      $sort: {
        updatedAt: -1,
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
      ];

      if (milestoneStatus === Milestone.PAID) {
        query.$and.push({
          $or: [
            { status: milestoneStatus },
            {
              status: Milestone.ARCHIVED,
              $or: [
                { donationCounters: { $size: 0 } },
                {
                  donationCounters: {
                    $not: { $elemMatch: { currentBalance: { $ne: '0' } } },
                  },
                },
              ],
            },
          ],
        });
      } else {
        query.$and.push({ status: milestoneStatus });
      }
    } else if (milestoneStatus === Milestone.REJECTED) {
      query.$and = [
        {
          $or: [
            { ownerAddress },
            { coownerAddress },
            // { reviewerAddress: myAddress }, // Not really "My Milestones"
            { recipientAddress },
          ],
        },
        { status: Milestone.REJECTED },
      ];
    } else {
      const resp = await feathersClient.service('campaigns').find({
        query: {
          $or: [{ ownerAddress }, { coownerAddress }],
          $select: ['_id'],
        },
      });

      query.$and = [
        {
          $or: [
            { ownerAddress },
            { coownerAddress },
            {
              $and: [
                { reviewerAddress: ownerAddress },
                {
                  // Reviewer does not need to see completed (Waiting for collect/disburse) milestones
                  status: {
                    $ne: Milestone.COMPLETED,
                  },
                },
              ],
            },
            { recipientAddress: ownerAddress },
            {
              $and: [
                { campaignId: { $in: resp.data.map(c => c._id) } },
                { status: Milestone.PROPOSED },
              ],
            },
          ],
        },
        {
          $or: [
            {
              status: {
                $nin: [Milestone.PAID, Milestone.CANCELED, Milestone.REJECTED, Milestone.ARCHIVED],
              },
            },
            {
              status: Milestone.ARCHIVED,
              donationCounters: {
                $elemMatch: { currentBalance: { $ne: '0' } },
              },
              'donationCounters.totalDonated': { $exists: true },
            },
          ],
        },
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
            onResult({
              ...resp,
              data: resp.data.map(m => MilestoneFactory.create(m)),
            });
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
      .then(resp =>
        onSuccess(
          resp.data.map(m => MilestoneFactory.create(m)),
          resp.total,
        ),
      )
      .catch(onError);
  }

  /**
   * Get Milestone donations
   *
   * @param id        ID of the Milestone which donations should be retrieved
   * @param $limit    Number of records to be loaded
   * @param $skip     Number of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static getDonations(id, $limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('donations')
      .find(
        paramsForServer({
          query: {
            $or: [
              {
                lessThanCutoff: { $ne: true },
                status: { $ne: Donation.FAILED },
                $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
              },
              {
                status: Donation.PAID,
                $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
              },
            ],
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
            lessThanCutoff: { $ne: true },
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
      // if a proposed or rejected milestone, create/update it only in feathers
      if ([Milestone.PROPOSED, Milestone.REJECTED].includes(milestone.status)) {
        let res;
        if (milestone.id) {
          res = await milestones.patch(milestone.id, milestone.toFeathers());
        } else {
          res = await milestones.create(milestone.toFeathers());
        }

        afterSave(true, null, MilestoneFactory.create(res));
        return true;
      }

      const profileHash = await this.uploadToIPFS(milestone);

      const network = await getNetwork();
      etherScanUrl = network.etherScanUrl;

      let tx;
      if (milestone.projectId) {
        if (milestone instanceof BridgedMilestone) {
          tx = milestone.contract(await getWeb3()).update(milestone.title, profileHash || '', 0, {
            from,
            $extraGas: extraGas(),
          });
        } else if (milestone instanceof LPMilestone) {
          tx = milestone.contract(await getWeb3()).update(milestone.title, profileHash || '', 0, {
            from,
            $extraGas: extraGas(),
          });
        } else if (milestone instanceof LPPCappedMilestone) {
          // LPPCappedMilestone has no update function, so just update feathers
          await milestones.patch(milestone._id, milestone.toFeathers());
          afterSave(null, false);
          return true;
        }
      } else {
        if (milestone instanceof LPPCappedMilestone) {
          throw new Error('LPPCappedMilestones are deprecated');
        }

        tx = this.deployMilestone(milestone, from, network, profileHash);
      }

      let milestoneId;
      await tx.once('transactionHash', async hash => {
        txHash = hash;

        // update milestone in feathers
        if (milestone.id) {
          await milestones.patch(milestone.id, milestone.toFeathers(txHash));
          milestoneId = milestone.id;
        } else {
          // create milestone in feathers
          milestoneId = (await milestones.create(milestone.toFeathers(txHash)))._id;
        }
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

  static deployMilestone(milestone, from, network, profileHash) {
    const { milestoneFactory, lppCappedMilestoneFactory } = network;

    /**
      Create a milestone on chain

      milestoneFactory params

      string _name,
      string _url,
      uint64 _parentProject,
      address _reviewer,
      address _recipient,
      address _milestoneManager,
      uint _maxAmount,
      address _acceptedToken,
      uint _reviewTimeoutSeconds
    * */

    let tx;
    if (milestone instanceof LPMilestone) {
      tx = milestoneFactory.newLPMilestone(
        milestone.title,
        profileHash || '',
        milestone.parentProjectId,
        milestone.reviewerAddress,
        milestone.recipientId,
        milestone.ownerAddress,
        milestone.isCapped ? utils.toWei(milestone.maxAmount.toFixed()) : 0,
        milestone.token.foreignAddress,
        5 * 24 * 60 * 60, // 5 days in seconds
        { from, $extraGas: extraGas() },
      );
    } else if (milestone instanceof LPPCappedMilestone) {
      tx = lppCappedMilestoneFactory.newMilestone(
        milestone.title,
        profileHash || '',
        milestone.parentProjectId,
        milestone.reviewerAddress,
        milestone.recipientAddress,
        milestone.campaignReviewerAddress,
        milestone.ownerAddress,
        utils.toWei(milestone.maxAmount.toFixed()),
        milestone.token.foreignAddress,
        5 * 24 * 60 * 60, // 5 days in seconds
        { from, $extraGas: extraGas() },
      );
    } else {
      // default to creating a BridgedMilestone
      tx = milestoneFactory.newBridgedMilestone(
        milestone.title,
        profileHash || '',
        milestone.parentProjectId,
        milestone.reviewerAddress,
        milestone.recipientAddress,
        milestone.ownerAddress,
        milestone.isCapped ? utils.toWei(milestone.maxAmount.toFixed()) : 0,
        milestone.token.foreignAddress,
        5 * 24 * 60 * 60, // 5 days in seconds
        { from, $extraGas: extraGas() },
      );
    }

    return tx;
  }

  static async uploadToIPFS(milestone) {
    // upload new milestone image
    try {
      if (milestone.image && milestone.image.includes('data:image')) {
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
          if (milestoneItem.image && milestoneItem.image.includes('data:image')) {
            try {
              milestoneItem.image = await IPFSService.upload(milestoneItem.image);
              milestoneItem.newImage = false;
            } catch (err) {
              ErrorPopup('Failed to upload milestone item image to ipfs');
            }
          }
        }
      }

      return await IPFSService.upload(milestone.toIpfs());
    } catch (err) {
      if (err != null) {
        ErrorPopup('Failed to upload milestone to ipfs');
      }
    }
    return undefined;
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
      .then(async network => {
        etherScanUrl = network.etherscan;

        const parentProjectId = milestone.campaign.projectId;

        // TODO fix this hack
        if (!parentProjectId || parentProjectId === '0') {
          throw new Error('campaign-not-mined');
        }

        const profileHash = await this.uploadToIPFS(milestone);
        milestone.parentProjectId = parentProjectId;

        this.deployMilestone(milestone, from, network, profileHash)
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
   * @param message         (string, optional) Reason why the milestone was reproposed
   * @param onSuccess       Callback function once response is obtained successfully
   * @param onError         Callback function if error is encountered
   */
  static reproposeRejectedMilestone({ milestone, message, onSuccess, onError }) {
    milestones
      .patch(milestone._id, {
        status: Milestone.PROPOSED,
        message,
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

      const milestoneContract = milestone.contract(web3);

      const fnName =
        milestone instanceof LPPCappedMilestone ? 'requestMarkAsComplete' : 'requestReview';

      await milestoneContract[fnName]({
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

        const milestoneContract = milestone.contract(web3);

        return milestoneContract
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

        const milestoneContract = milestone.contract(web3);

        const fnName =
          milestone instanceof LPPCappedMilestone
            ? 'approveMilestoneCompleted'
            : 'approveCompleted';

        return milestoneContract[fnName]({
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

        const milestoneContract = milestone.contract(web3);

        const fnName =
          milestone instanceof LPPCappedMilestone ? 'rejectCompleteRequest' : 'rejectCompleted';

        return milestoneContract[fnName]({
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
   * Change the recipient of the milestone
   *
   * @param milestone       a Milestone model
   * @param from            (string) Ethereum address
   * @param newRecipient    (string) Address of the new recipient
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   */

  static changeRecipient({ milestone, from, newRecipient, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        etherScanUrl = network.etherscan;

        const milestoneContract = milestone.contract(web3);

        return milestoneContract
          .changeRecipient(newRecipient, {
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                pendingRecipientAddress: newRecipient,
              })
              .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
              .catch(e => onError('patch-error', e));
          })
          .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`));
      })
      .catch(err => {
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

        const milestoneContract = milestone.contract(web3);

        const execute = opts => {
          if (milestone instanceof LPPCappedMilestone)
            return milestoneContract.mWithdraw(data.pledges, opts);
          if (milestone instanceof LPMilestone)
            return milestoneContract.mTransfer(data.pledges, opts);
          // BridgedMilestone, set autoDisburse = false if we have more donations to withdraw
          return milestoneContract.mWithdraw(
            data.pledges,
            data.tokens,
            !data.hasMoreDonations,
            opts,
          );
        };

        return execute({
          from,
          $extraGas: extraGas(),
        })
          .once('transactionHash', hash => {
            txHash = hash;

            DonationService.updateSpentDonations(data.donations)
              .then(() => {
                if (!data.hasMoreDonations && milestone.fullyFunded) {
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
        // TODO: remove or change below commented line - relates to gh-1177
        // if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }
}

export default MilestoneService;
