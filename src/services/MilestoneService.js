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

import Donation from '../models/Donation';
// import IPFSService from './IPFSService';
// import ErrorPopup from '../components/ErrorPopup';

const milestones = feathersClient.service('milestones');

BigNumber.config({ DECIMAL_PLACES: 18 });

class MilestoneService {
  constructor() {
    this.milestoneSubscription = null;
    this.donationSubscription = null;
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
        resp =>
          onResult(
            Object.assign({}, resp, {
              data: resp.data.map(m => new Milestone(m)),
            }),
          ),
        onError,
      );
  }

  /**
   * Unsubscribe from Milestone listener
   */

  static unsubscribe() {
    if (this.milestoneSubscription) this.milestoneSubscription.unsubscribe();
    if (this.donationSubscription) this.donationSubscription.unsubscribe();
  }

  /**
   * Lazy-load DAC Donations by subscribing to donations listener
   *
   * @param id        ID of the DAC which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribeDonations(id, onSuccess = () => {}, onError = () => {}) {
    return feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(
        paramsForServer({
          query: {
            amountRemaining: { $ne: 0 },
            status: { $ne: Donation.FAILED },
            $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
            $sort: { createdAt: -1 },
          },
          schema: 'includeTypeAndGiverDetails',
        }),
      )
      .subscribe(resp => {
        onSuccess(resp.data.map(d => new Donation(d)));
      }, onError);
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
            utils.toWei(maxAmount.toString()),
            token.foreignAddress,
            5 * 24 * 60 * 60, // 5 days in seconds
            { from, $extraGas: extraGas() },
          )
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.PROPOSED,
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
  static requestMarkComplete({ milestone, from, proof, onTxHash, onConfirmation, onError }) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        etherScanUrl = network.etherscan;

        const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

        return cappedMilestone
          .requestMarkAsComplete({
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.NEEDS_REVIEW,
                message: proof.message,
                proofItems: proof.items.map(i => i.getItem()),
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
      .then(([network, web3, donations]) => {
        etherScanUrl = network.etherscan;

        const cappedMilestone = new LPPCappedMilestone(web3, milestone.pluginAddress);

        return cappedMilestone
          .mWithdraw(donations, {
            from,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;

            return milestones
              .patch(milestone._id, {
                status: Milestone.PAYING,
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
}

export default MilestoneService;
