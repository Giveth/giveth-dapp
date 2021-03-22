import { paramsForServer } from 'feathers-hooks-common';
import { feathersClient } from '../lib/feathersClient';

const aggregateDonations = feathersClient.service('aggregateDonations');

class AggregateDonationsService {
  /**
   * Get a aggregateDonation
   *
   * @param id   ID of dac, campaign or milestone
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amount of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static get(id, $limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    const query = {
      id,
      $limit,
      $skip,
    };
    return aggregateDonations
      .find(
        paramsForServer({
          query,
        }),
      )
      .then(resp => onSuccess(resp.data, resp.total))
      .catch(onError);
  }
}

export default AggregateDonationsService;
