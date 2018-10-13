import BigNumber from 'bignumber.js';
import { paramsForServer } from 'feathers-hooks-common';

import { feathersClient } from '../lib/feathersClient';
import Donation from '../models/Donation';

BigNumber.config({ DECIMAL_PLACES: 18 });

class MilestoneService {
  /**
   * Lazy-load DAC Donations by subscribing to donations listener
   *
   * @param id        ID of the DAC which donations should be retrieved
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static subscribeDonations(id, onSuccess = () => {}, onError = () => {}) {
    const query = paramsForServer({
      query: {
        amountRemaining: { $ne: 0 },
        status: { $ne: Donation.FAILED },
        $or: [{ intendedProjectTypeId: id }, { ownerTypeId: id }],
      },
      schema: 'includeTypeAndGiverDetails',
      $sort: { createdAt: -1 },
    });

    return feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(resp => onSuccess(resp.data.map(d => new Donation(d))), onError);
  }
}

export default MilestoneService;
