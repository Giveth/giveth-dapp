import { paramsForServer } from 'feathers-hooks-common';
import { feathersClient } from '../lib/feathersClient';

const aggregateDonations = feathersClient.service('aggregateDonations');

class AggregateDonationsService {
  /**
   * Get a aggregateDonation
   *
   * @param id   ID of dac, campaign or trace
   * @param $limit    Amount of records to be loaded
   * @param $skip     Amount of records to be skipped
   * @param onSuccess Callback function once response is obtained successfully
   * @param onError   Callback function if error is encountered
   */
  static get(id, $limit = 100, $skip = 0, onSuccess = () => {}, onError = () => {}) {
    return aggregateDonations
      .find(
        paramsForServer({
          query: {
            id,
            $limit,
            $skip,
          },
        }),
      )
      .then(resp => onSuccess(resp.data, resp.total))
      .catch(onError);
  }
}

export default AggregateDonationsService;
