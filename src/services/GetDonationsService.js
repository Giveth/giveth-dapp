import { paramsForServer } from 'feathers-hooks-common';
import { feathersClient } from 'lib/feathersClient';

import Donation from '../models/Donation';

const getDonations = feathersClient.service('donations');

class GetDonationsService {
  constructor() {
    this.donationSubscription = null;
  }

  static getUserDonations({ currentUser, itemsPerPage, skipPages, subscribe, onResult, onError }) {
    const find = paramsForServer({
      schema: 'includeTypeDetails',
      query: {
        giverAddress: currentUser.address,
        lessThanCutoff: { $ne: true },
        $limit: itemsPerPage,
        $skip: skipPages * itemsPerPage,
        $sort: { createdAt: -1 },
      },
    });

    if (subscribe) {
      return this.subscribe(find, onResult, onError);
    }
    return this.getDonations(find, onResult, onError);
  }

  static getDonations(find, onResult, onError) {
    getDonations
      .find(find)
      .then(resp => {
        onResult({
          ...resp,
          data: resp.data.map(d => new Donation(d)),
        });
      })
      .catch(onError);
  }

  static subscribe(find, onResult, onError) {
    this.donationSubscription = getDonations
      .watch({ listStrategy: 'always' })
      .find(find)
      .subscribe(resp => {
        onResult({
          ...resp,
          data: resp.data.map(d => new Donation(d)),
        });
      }, onError);

    return this.donationSubscription;
  }

  static unsubscribe() {
    if (this.donationSubscription) this.donationSubscription.unsubscribe();
  }
}

export default GetDonationsService;
