import { feathersClient } from '../../../lib/feathersClient';
import Campaign from '../../../models/Campaign';
import Trace from '../../../models/Trace';
import Community from '../../../models/Community';

const LoadProjectsInfo = async ({ userAddress }) => {
  return Promise.all([
    feathersClient.service('communities').find({
      query: {
        status: Community.ACTIVE,
        ownerAddress: userAddress,
        $select: ['_id'],
        $limit: 100,
        $sort: {
          createdAt: -1,
        },
      },
    }),

    feathersClient.service('campaigns').find({
      query: {
        status: Campaign.ACTIVE,
        $select: ['ownerAddress', 'title', '_id', 'projectId'],
        $limit: 100,
        $sort: {
          createdAt: -1,
        },
      },
    }),

    feathersClient.service('traces').find({
      query: {
        status: Trace.IN_PROGRESS,
        fullyFunded: { $ne: true },
        $select: [
          'title',
          '_id',
          'projectId',
          'campaignId',
          'maxAmount',
          'status',
          'tokenAddress',
          'donationCounters',
        ],
        $limit: 100,
        $sort: {
          createdAt: -1,
        },
      },
    }),
  ]);
};

export default LoadProjectsInfo;
