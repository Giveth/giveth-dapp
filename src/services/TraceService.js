/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */

import { notification } from 'antd';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { paramsForServer } from 'feathers-hooks-common';
import TraceFactory from 'models/TraceFactory';
import { feathersClient } from 'lib/feathersClient';
import extraGas from 'lib/blockchain/extraGas';
import DonationBlockchainService from 'services/DonationBlockchainService';
import { MilestoneFactory } from '@giveth/lpp-milestones';
import { LPPCappedMilestoneFactory } from '@giveth/lpp-capped-milestone';
import Trace from '../models/Trace';
import IPFSService from './IPFSService';
import ErrorPopup from '../components/ErrorPopup';
import ErrorHandler from '../lib/ErrorHandler';

import Donation from '../models/Donation';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import config from '../configuration';
import { getConversionRateBetweenTwoSymbol } from './ConversionRateService';

const etherScanUrl = config.etherscan;
const traces = feathersClient.service('traces');

BigNumber.config({ DECIMAL_PLACES: 18 });

class TraceService {
  /**
   * Get a Trace defined by ID
   *
   * @param id   ID of the Trace to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      traces
        .find({ query: { _id: id } })
        .then(resp => {
          resolve(TraceFactory.create(resp.data[0]));
        })
        .catch(reject);
    });
  }

  /**
   * Get a trace defined by slug
   *
   * @param slug   Slug of the trace to be retrieved
   */
  static getBySlug(slug) {
    return new Promise((resolve, reject) => {
      traces
        .find({
          query: {
            slug,
          },
        })
        .then(resp => {
          if (resp.data.length) resolve(TraceFactory.create(resp.data[0]));
          else {
            reject();
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Subscribe to a Trace defined by ID
   *
   * @param id   ID of the Trace to be retrieved
   */
  static subscribeOne(id, onResult, onError, slug) {
    const query = {};
    if (id) {
      query._id = id;
    } else if (slug) {
      query.slug = slug;
    }
    traces
      .watch({ listStrategy: 'always' })
      .find({ query })
      .subscribe(resp => {
        const { total, data } = resp;
        if (total === 0) {
          onError(404);
          return;
        }
        onResult(TraceFactory.create(data[0]));
      }, onError);
  }

  /**
   * Lazy-load Traces by subscribing to Trace listener
   *
   * @param traceStatus   any of the Trace model statuses
   * @param ownerAddress      ethereum address of the owner
   * @param recipientAddress  ethereum address of the recipient
   * @param skipPages         paging: the current page
   * @param itemsPerPage      paging: amount of items per page
   *
   * returns a Promise
   *  resolve:
   *    Object
   *      data                (Array) Trace models
   *      limit               (Number) items per page
   *      skipped             (Number) pages skipped
   *      totalResults        (Number) total results
   *
   *  reject:
   *    error message
   */
  static async getUserTraces({
    traceStatus,
    ownerAddress,
    recipientAddress,
    skipPages,
    itemsPerPage,
    onResult,
    onError,
    subscribe,
  }) {
    const query = {
      $sort: {
        updatedAt: -1,
      },
      $limit: itemsPerPage,
      $skip: skipPages * itemsPerPage,
    };

    if ([Trace.CANCELED, Trace.PAID].includes(traceStatus)) {
      query.$and = [
        {
          $or: [
            { ownerAddress },
            // { reviewerAddress: myAddress }, // Not really "My Traces"
            { recipientAddress },
          ],
        },
      ];

      if (traceStatus === Trace.PAID) {
        query.$and.push({
          $or: [
            { status: traceStatus },
            {
              status: Trace.ARCHIVED,
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
        query.$and.push({ status: traceStatus });
      }
    } else if (traceStatus === Trace.REJECTED) {
      query.$and = [
        {
          $or: [
            { ownerAddress },
            // { reviewerAddress: myAddress }, // Not really "My Traces"
            { recipientAddress },
          ],
        },
        { status: Trace.REJECTED },
      ];
    } else {
      const resp = await feathersClient.service('campaigns').find({
        query: {
          $or: [{ ownerAddress }, { coownerAddress: ownerAddress }],
          $select: ['_id'],
        },
      });

      query.$and = [
        {
          $or: [
            { ownerAddress },
            {
              $and: [
                { reviewerAddress: ownerAddress },
                {
                  // Reviewer does not need to see completed (Waiting for collect/disburse) traces
                  status: {
                    $ne: Trace.COMPLETED,
                  },
                },
              ],
            },
            { recipientAddress: ownerAddress },
            {
              $and: [
                { campaignId: { $in: resp.data.map(c => c._id) } },
                { status: Trace.PROPOSED },
              ],
            },
          ],
        },
        {
          $or: [
            {
              status: {
                $nin: [Trace.PAID, Trace.CANCELED, Trace.REJECTED, Trace.ARCHIVED],
              },
            },
            {
              status: Trace.ARCHIVED,
              donationCounters: {
                $elemMatch: { currentBalance: { $ne: '0' } },
              },
              'donationCounters.totalDonated': { $exists: true },
            },
          ],
        },
      ];
    }

    if (!subscribe) {
      return traces
        .find({ query })
        .then(resp => {
          onResult({
            ...resp,
            data: resp.data.map(m => TraceFactory.create(m)),
          });
        })
        .catch(onError);
    }
    return traces
      .watch({ listStrategy: 'always' })
      .find({ query })
      .subscribe(resp => {
        try {
          onResult({
            ...resp,
            data: resp.data.map(m => TraceFactory.create(m)),
          });
        } catch (e) {
          onError(e);
        }
      }, onError);
  }

  /**
   * Get Active Traces sorted by created date
   *
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amount of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   * @param query
   */
  static getActiveTraces($limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}, query) {
    const _query = {
      status: Trace.IN_PROGRESS,
      $sort: { createdAt: -1 },
      $limit,
      $skip,
    };

    if (query) Object.assign(_query, query);

    return traces
      .find({ query: _query })
      .then(resp =>
        onSuccess(
          resp.data.map(m => TraceFactory.create(m)),
          resp.total,
        ),
      )
      .catch(onError);
  }

  /**
   * Get Trace donations
   *
   * @param id        ID of the Trace which donations should be retrieved
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
            $sort: { createdAt: -1, usdValue: -1 },
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
    let initialTotal;
    return feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          lessThanCutoff: { $ne: true },
          status: { $ne: Donation.FAILED },
          $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
          $limit: 0,
        },
      })
      .subscribe(resp => {
        if (initialTotal === undefined) {
          initialTotal = resp.total;
          onSuccess(0);
        } else {
          onSuccess(resp.total - initialTotal);
        }
      }, onError);
  }

  /**
   * Save new Trace to the blockchain or update existing one in feathers
   * TODO: Handle error states properly
   *
   * @param trace       Trace object to be saved
   * @param from        address of the user saving the Trace
   * @param afterSave   Callback to be triggered after the Trace is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   * @param onError     Callback function if error is encountered
   * @param web3
   */
  static async save({
    trace,
    from,
    afterSave = () => {},
    afterMined = () => {},
    onError = () => {},
    web3,
  }) {
    if (trace.id && trace.projectId === 0) {
      return onError('You must wait for your Trace creation to finish before you can update it');
    }

    if (!trace.parentProjectId || trace.parentProjectId === '0') {
      return onError(
        `It looks like the campaign has not been mined yet. Please try again in a bit`,
      );
    }

    let txHash;
    let res = trace;

    try {
      const query = {
        campaignId: trace.campaignId,
        title: {
          $regex: `\\s*${trace.title.replace(/^\s+|\s+$|\s+(?=\s)/g, '')}\\s*`,
          $options: 'i',
        },
        $limit: 1,
      };
      if (trace.id) {
        query._id = { $ne: trace.id };
      }
      const response = await traces.find({
        query,
      });
      if (response.total && response.total > 0) {
        const message = 'A trace with this title already exists. Please select a different title.';
        ErrorHandler({ message }, message);
        return onError();
      }
      if (trace.maxAmount && trace.isCapped) {
        const result = await getConversionRateBetweenTwoSymbol({
          date: new Date(),
          symbol: trace.token.symbol,
          to: 'USD',
        });
        const { minimumPayoutUsdValue } = await feathersClient.service('/whitelist').find();
        const rate = result.rates.USD;
        if (rate * trace.maxAmount < minimumPayoutUsdValue) {
          return onError(undefined, undefined, true);
        }
      }
      const profileHash = await this.uploadToIPFS(trace);
      if (!profileHash) return onError();

      // if a proposed or rejected trace, create/update it only in feathers
      if ([Trace.PROPOSED, Trace.REJECTED].includes(trace.status)) {
        if (trace.id) {
          res = await traces.patch(trace.id, trace.toFeathers());
        } else {
          res = await traces.create(trace.toFeathers());
        }

        afterSave(false, TraceFactory.create(res));
        return true;
      }

      // nothing to update or failed ipfs upload
      if (trace.projectId && (trace.url === profileHash || !profileHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!profileHash) {
          res = await traces.patch(trace._id, trace.toFeathers());
        }
        afterSave(false, res);
        return true;
      }

      let tx;
      if (trace.projectId) {
        if (trace instanceof BridgedTrace) {
          tx = trace.contract(web3).update(trace.title, profileHash || '', 0, {
            from,
            $extraGas: extraGas(),
          });
        } else if (trace instanceof LPTrace) {
          tx = trace.contract(web3).update(trace.title, profileHash || '', 0, {
            from,
            $extraGas: extraGas(),
          });
        } else if (trace instanceof LPPCappedTrace) {
          // LPPCappedTrace has no update function, so just update feathers
          res = await traces.patch(trace._id, trace.toFeathers());
          afterSave(false, res);
          return true;
        }
      } else {
        if (trace instanceof LPPCappedTrace) {
          throw new Error('LPPCappedMilestones are deprecated');
        }

        const traceFactory = new MilestoneFactory(web3, config.milestoneFactoryAddress);
        const lppCappedTraceFactory = new LPPCappedMilestoneFactory(
          web3,
          config.lppCappedMilestoneFactoryAddress,
        );
        const network = { traceFactory, lppCappedTraceFactory };

        tx = this.deployTrace(trace, from, network, profileHash);
      }

      await tx.once('transactionHash', async hash => {
        txHash = hash;

        // update trace in feathers
        if (trace.id) {
          res = await traces.patch(trace.id, trace.toFeathers(txHash));
        } else {
          // create trace in feathers
          res = await traces.create(trace.toFeathers(txHash));
        }
        afterSave(`${etherScanUrl}tx/${txHash}`, res);
      });

      afterMined(`${etherScanUrl}tx/${txHash}`);
    } catch (err) {
      const message = `Something went wrong with the Trace ${
        trace.projectId > 0 ? 'update' : 'creation'
      }. Is your wallet unlocked? ${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`;
      console.error('save trace error', err);
      onError(message, err);
    }

    return true;
  }

  static deployTrace(trace, from, network, profileHash) {
    const { traceFactory, lppCappedTraceFactory } = network;

    /**
      Create a trace on chain

      traceFactory params

      string _name,
      string _url,
      uint64 _parentProject,
      address _reviewer,
      address _recipient,
      address _traceManager,
      uint _maxAmount,
      address _acceptedToken,
      uint _reviewTimeoutSeconds
    * */

    let tx;
    if (trace instanceof LPTrace) {
      tx = traceFactory.newLPMilestone(
        trace.title,
        profileHash || '',
        trace.parentProjectId,
        trace.reviewerAddress,
        trace.recipientId,
        trace.ownerAddress,
        trace.isCapped ? utils.toWei(trace.maxAmount.toFixed()) : 0,
        trace.token.foreignAddress,
        5 * 24 * 60 * 60, // 5 days in seconds
        { from, $extraGas: extraGas() },
      );
    } else if (trace instanceof LPPCappedTrace) {
      tx = lppCappedTraceFactory.newMilestone(
        trace.title,
        profileHash || '',
        trace.parentProjectId,
        trace.reviewerAddress,
        trace.recipientAddress,
        trace.campaignReviewerAddress,
        trace.ownerAddress,
        utils.toWei(trace.maxAmount.toFixed()),
        trace.token.foreignAddress,
        5 * 24 * 60 * 60, // 5 days in seconds
        { from, $extraGas: extraGas() },
      );
    } else {
      // default to creating a BridgedTrace
      tx = traceFactory.newBridgedMilestone(
        trace.title,
        profileHash || '',
        trace.parentProjectId,
        trace.reviewerAddress,
        trace.recipientAddress,
        trace.ownerAddress,
        trace.isCapped ? utils.toWei(trace.maxAmount.toFixed()) : 0,
        trace.token.foreignAddress,
        5 * 24 * 60 * 60, // 5 days in seconds
        { from, $extraGas: extraGas() },
      );
    }

    return tx;
  }

  static async uploadToIPFS(trace) {
    // upload new trace image
    try {
      if (trace.image && trace.image.includes('data:image')) {
        try {
          trace.image = await IPFSService.upload(trace.image);
          trace.newImage = false;
        } catch (err) {
          notification.error({
            message: '',
            description: 'Failed to upload trace image to ipfs',
          });
          return undefined;
        }
      }

      // upload new trace item images for new traces
      if (trace.itemizeState) {
        for (const traceItem of trace.items) {
          if (traceItem.image && traceItem.image.includes('data:image')) {
            try {
              traceItem.image = await IPFSService.upload(traceItem.image);
              traceItem.newImage = false;
            } catch (err) {
              notification.error({
                message: '',
                description: 'Failed to upload trace item image to ipfs',
              });
              return undefined;
            }
          }
        }
      }

      return await IPFSService.upload(trace.toIpfs());
    } catch (err) {
      if (err != null) {
        ErrorPopup('Failed to upload trace to ipfs');
      }
    }
    return undefined;
  }

  /**
   * Delete a proposed trace
   *
   * @param trace   a Trace model
   * @param onSuccess   Callback function once response is obtained successfully
   * @param onError     Callback function if error is encountered
   */
  static deleteProposedTrace({ trace, onSuccess, onError }) {
    traces
      .remove(trace._id)
      .then(() => onSuccess())
      .catch(e => onError(e));
  }

  /**
   * Reject a proposed trace
   *
   * @param trace       a Trace model
   * @param rejectReason    (string, optional) message why the trace is rejected
   * @param onSuccess       Callback function once response is obtained successfully
   * @param onError         Callback function if error is encountered
   */
  static rejectProposedTrace({ trace, rejectReason, onSuccess, onError }) {
    const reject = { status: 'Rejected' };
    if (rejectReason) reject.message = rejectReason;
    traces
      .patch(trace._id, reject)
      .then(() => onSuccess())
      .catch(e => onError(e));
  }

  /**
   * Accept a proposed trace
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the trace was accepted
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   * @param web3
   */
  static async acceptProposedTrace({
    trace,
    from,
    proof,
    onTxHash,
    onConfirmation,
    onError,
    web3,
  }) {
    let txHash;

    const parentProjectId = trace.campaign.projectId;

    // TODO fix this hack
    if (!parentProjectId || parentProjectId === '0') {
      throw new Error('campaign-not-mined');
    }

    const profileHash = await this.uploadToIPFS(trace);
    trace.parentProjectId = parentProjectId;

    const traceFactory = new MilestoneFactory(web3, config.milestoneFactoryAddress);
    const lppCappedTraceFactory = new LPPCappedMilestoneFactory(
      web3,
      config.lppCappedMilestoneFactoryAddress,
    );
    const network = { traceFactory, lppCappedTraceFactory };

    this.deployTrace(trace, from, network, profileHash)
      .once('transactionHash', hash => {
        txHash = hash;

        return traces
          .patch(trace._id, {
            status: Trace.PENDING,
            mined: false,
            message: proof.message,
            proofItems: proof.items,
            txHash,
          })
          .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
          .catch(e => onError('patch-error', e));
      })
      .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Repropose a proposed trace that has been rejected
   *
   * @param trace       a Trace model
   * @param message         (string, optional) Reason why the trace was reproposed
   * @param onSuccess       Callback function once response is obtained successfully
   * @param onError         Callback function if error is encountered
   */
  static reproposeRejectedTrace({ trace, message, onSuccess, onError }) {
    traces
      .patch(trace._id, {
        status: Trace.PROPOSED,
        message,
      })
      .then(() => onSuccess())
      .catch(e => onError(e));
  }

  /**
   * Request a trace to be marked as complete
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the trace is marked as complete
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   * @param web3
   */
  static async requestMarkComplete({
    trace,
    from,
    proof,
    onTxHash,
    onConfirmation,
    onError,
    web3,
  }) {
    let txHash;

    try {
      const traceContract = trace.contract(web3);

      const fnName = trace instanceof LPPCappedTrace ? 'requestMarkAsComplete' : 'requestReview';

      await traceContract[fnName]({
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
                ErrorPopup('Failed to upload trace proof item image to ipfs', err);
              }
            }
          }

          try {
            await traces.patch(trace._id, {
              status: Trace.NEEDS_REVIEW,
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
      if (txHash && err.message && err.message.includes('unknown transaction')) onError();
      // bug in web3 seems to constantly fail due to this error, but the tx is correct
      else ErrorHandler(err, `${etherScanUrl}tx/${txHash}`);
    }
  }

  /**
   * Cancel a trace
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the trace is canceled
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   * @param web3
   */

  static cancelTrace({ trace, from, proof, onTxHash, onConfirmation, onError, web3 }) {
    let txHash;

    const traceContract = trace.contract(web3);

    return traceContract
      .cancelMilestone({
        from,
        $extraGas: extraGas(),
      })
      .once('transactionHash', hash => {
        txHash = hash;

        return traces
          .patch(trace._id, {
            status: Trace.CANCELED,
            message: proof.message,
            proofItems: proof.items,
            mined: false,
            txHash,
          })
          .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
          .catch(e => onError('patch-error', e));
      })
      .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError();
        // bug in web3 seems to constantly fail due to this error, but the tx is correct
        else ErrorHandler(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Approve the completion of a trace (after the trace has been requested as complete)
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the trace is approved for completion
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   * @param web3
   */

  static approveTraceCompletion({ trace, from, proof, onTxHash, onConfirmation, onError, web3 }) {
    let txHash;

    const traceContract = trace.contract(web3);

    const fnName = trace instanceof LPPCappedTrace ? 'approveTraceCompleted' : 'approveCompleted';

    return traceContract[fnName]({
      from,
      $extraGas: extraGas(),
    })
      .once('transactionHash', hash => {
        txHash = hash;

        return traces
          .patch(trace._id, {
            status: Trace.COMPLETED,
            mined: false,
            message: proof.message,
            proofItems: proof.items,
            txHash,
          })
          .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
          .catch(e => onError('patch-error', e));
      })
      .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError();
        // bug in web3 seems to constantly fail due to this error, but the tx is correct
        else ErrorHandler(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Reject the completion of a trace (after the trace has been requested as complete)
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param proof           A proof object:
        message               Reason why the trace is rejected for completion
        items                 Attached proof
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   * @param web3
   */

  static rejectTraceCompletion({ trace, from, proof, onTxHash, onConfirmation, onError, web3 }) {
    let txHash;

    const traceContract = trace.contract(web3);

    const fnName = trace instanceof LPPCappedTrace ? 'rejectCompleteRequest' : 'rejectCompleted';

    return traceContract[fnName]({
      from,
      $extraGas: extraGas(),
    })
      .once('transactionHash', hash => {
        txHash = hash;

        return traces
          .patch(trace._id, {
            status: Trace.IN_PROGRESS,
            mined: false,
            message: proof.message,
            proofItems: proof.items,
            txHash,
          })
          .then(() => onTxHash(`${etherScanUrl}tx/${txHash}`))
          .catch(e => onError('patch-error', e));
      })
      .on('receipt', () => onConfirmation(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) onError();
        // bug in web3 seems to constantly fail due to this error, but the tx is correct
        else ErrorHandler(err, `${etherScanUrl}tx/${txHash}`);
      });
  }

  /**
   * Change the recipient of the trace
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param newRecipient    (string) Address of the new recipient
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param web3
   */

  static changeRecipient({ trace, from, newRecipient, onTxHash, onConfirmation, web3 }) {
    let txUrl;

    const traceContract = trace.contract(web3);

    return traceContract
      .changeRecipient(newRecipient, {
        from,
        $extraGas: extraGas(),
      })
      .once('transactionHash', async hash => {
        txUrl = `${etherScanUrl}tx/${hash}`;
        onTxHash(txUrl);
      })
      .on('receipt', () => onConfirmation(txUrl))
      .catch(err => {
        ErrorHandler(err, txUrl);
      });
  }

  /**
   * Withdraw the donations (pledges) from a trace
   * Only possible when the traces was approved for completion
   *
   * @param trace       a Trace model
   * @param from            (string) Ethereum address
   * @param onTxHash        Callback function once the transaction was created
   * @param onConfirmation  Callback function once the transaction was mined
   * @param onError         Callback function if error is encountered
   * @param web3
   */

  static withdraw({ trace, from, onTxHash, onConfirmation, onError, web3 }) {
    let txHash;

    DonationBlockchainService.getTraceDonations(trace._id)
      .then(data => {
        const traceContract = trace.contract(web3);

        const execute = opts => {
          if (trace instanceof LPPCappedTrace) return traceContract.mWithdraw(data.pledges, opts);
          if (trace instanceof LPTrace) return traceContract.mTransfer(data.pledges, opts);
          // BridgedTrace, set autoDisburse = false if we have more donations to withdraw
          return traceContract.mWithdraw(data.pledges, data.tokens, !data.hasMoreDonations, opts);
        };

        return execute({
          from,
          $extraGas: extraGas(),
        })
          .once('transactionHash', hash => {
            txHash = hash;

            DonationBlockchainService.updateSpentDonations(data.donations)
              .then(() => {
                if (!data.hasMoreDonations && trace.fullyFunded) {
                  traces
                    .patch(trace._id, {
                      status: Trace.PAYING,
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
          .catch(err => {
            ErrorHandler(
              err,
              'Something went wrong with withdrawal. Please try again after refresh.' +
                `${JSON.stringify(err, null, 2)}`,
            );
          });
      })
      .catch(err => {
        // TODO: remove or change below commented line - relates to gh-1177
        // if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct        if (txHash && err.message && err.message.includes('unknown transaction')) onError(); // bug in web3 seems to constantly fail due to this error, but the tx is correct
        if (err) onError(err, `${etherScanUrl}tx/${txHash}`);
      });
  }
}

export default TraceService;
