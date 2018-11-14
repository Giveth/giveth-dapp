import BigNumber from 'bignumber.js';
import { paramsForServer } from 'feathers-hooks-common';
// import { LPPCappedMilestone } from 'lpp-capped-milestone';
import Milestone from 'models/Milestone';
import { feathersClient } from '../lib/feathersClient';
// import getNetwork from '../lib/blockchain/getNetwork';
// import { getWeb3 } from '../lib/blockchain/getWeb3';

import Donation from '../models/Donation';
// import IPFSService from './IPFSService';
// import ErrorPopup from '../components/ErrorPopup';

const milestones = feathersClient.service('milestones');

BigNumber.config({ DECIMAL_PLACES: 18 });

class MilestoneService {
  constructor() {
    this.milestoneListener = null;
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
  static async subscribe({
    milestoneStatus,
    ownerAddress,
    recipientAddress,
    skipPages,
    itemsPerPage,
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

    return new Promise((resolve, reject) => {
      this.milestoneListener = milestones
        .watch({ listStrategy: 'always' })
        .find({ query })
        .subscribe(resp => {
          const newResp = Object.assign({}, resp, {
            data: resp.data.map(m => new Milestone(m)),
          });
          resolve(newResp);
        }, reject);
      return this.milestoneListener;
    });
  }

  /**
   * Unsubscribe from Milestone listener
   */

  static unsubscribe() {
    if (this.milestoneListener) this.milestoneListener.unsubscribe();
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
            status: { $nin: [Donation.FAILED, Donation.TO_APPROVE] },
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
}

export default MilestoneService;
