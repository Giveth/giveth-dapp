import { paramsForServer } from 'feathers-hooks-common';

import Donation from '../../../models/Donation';
import DonationService from '../../../services/DonationService';

const GetDonations = ({
  userAddress,
  communities,
  campaigns,
  itemsPerPage,
  skipPages,
  onResult,
  onError,
  subscribe,
}) => {
  // here we get all the ids.
  // TODO: less overhead here if we move it all to a single service.
  // NOTE: This will not rerun, meaning after any dac/campaign/trace is added

  if (userAddress) {
    const communitiesIds = communities && communities.map(c => c._id);
    const campaignIds = campaigns && campaigns.map(c => c._id);

    const $or = [];

    if (campaignIds)
      $or.push({
        ownerTypeId: { $in: campaignIds },
        status: Donation.COMMITTED,
      });

    if (communitiesIds)
      $or.push({
        delegateTypeId: { $in: communitiesIds },
        status: { $in: [Donation.WAITING, Donation.TO_APPROVE] },
      });

    if ((!campaignIds && !communitiesIds) || (campaignIds && communitiesIds))
      $or.push(
        {
          ownerTypeId: userAddress,
          delegateId: { $exists: false },
          status: Donation.WAITING,
        },
        // {
        // ownerTypeId: userAddress,
        // delegateTypeId: { $gt: 0 },
        // },
      );

    const query = paramsForServer({
      query: {
        lessThanCutoff: { $ne: true },
        $or,
        $sort: { createdAt: -1 },
        $limit: itemsPerPage,
        $skip: skipPages * itemsPerPage,
      },
      schema: 'includeTypeAndGiverDetails',
    });

    if (subscribe) return DonationService.subscribe(query, onResult, onError);
    return DonationService.getDonations(query, onResult, onError);
  }
  return null;
};

export default GetDonations;
