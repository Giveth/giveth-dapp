import { feathersClient } from '../../../lib/feathersClient';
import Campaign from '../../../models/Campaign';
import Community from '../../../models/Community';

const LoadProjectsInfo = async userAddress => {
  const communities = feathersClient.service('communities').find({
    query: {
      status: Community.ACTIVE,
      ownerAddress: userAddress,
      $select: ['_id', 'title'],
      $limit: 100,
      $sort: {
        createdAt: -1,
      },
    },
  });

  const campaigns = feathersClient.service('campaigns').find({
    query: {
      status: Campaign.ACTIVE,
      ownerAddress: userAddress,
      $select: ['ownerAddress', 'title', '_id', 'projectId'],
      $limit: 100,
      $sort: {
        createdAt: -1,
      },
    },
  });

  const promiseArray = [communities, campaigns];
  return Promise.all(promiseArray);
};

export default LoadProjectsInfo;
