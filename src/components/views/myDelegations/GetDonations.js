import { paramsForServer } from 'feathers-hooks-common';

import Donation from '../../../models/Donation';
import GetDonationsService from '../../../services/GetDonationsService';

const GetDonations = async ({
  userAddress,
  communities,
  campaigns,
  itemsPerPage,
  skipPages,
  onResult,
  onError,
  subscribe = false,
}) => {
  // here we get all the ids.
  // TODO: less overhead here if we move it all to a single service.
  // NOTE: This will not rerun, meaning after any dac/campaign/trace is added

  if (userAddress) {
    const communitiesIds = communities.map(c => c._id);
    const campaignIds = campaigns.filter(c => c.ownerAddress === userAddress).map(c => c._id);

    const query = paramsForServer({
      query: {
        lessThanCutoff: { $ne: true },
        $or: [
          { ownerTypeId: { $in: campaignIds }, status: Donation.COMMITTED },
          {
            delegateTypeId: { $in: communitiesIds },
            status: { $in: [Donation.WAITING, Donation.TO_APPROVE] },
          },
          {
            ownerTypeId: userAddress,
            delegateId: { $exists: false },
            status: Donation.WAITING,
          },
          // {
          // ownerTypeId: userAddress,
          // delegateTypeId: { $gt: 0 },
          // },
        ],
        $sort: { createdAt: -1 },
        $limit: itemsPerPage,
        $skip: skipPages * itemsPerPage,
      },
      schema: 'includeTypeAndGiverDetails',
    });

    if (subscribe) {
      return GetDonationsService.subscribe(query, onResult, onError);
    }
    return GetDonationsService.getDonations(query, onResult, onError);
  }
  return null;
};

export default GetDonations;
