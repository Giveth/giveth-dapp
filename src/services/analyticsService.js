import { feathersClient } from '../lib/feathersClient';

export const inquirySubscriptionStatus = async ({ projectTypeId, userAddress }) => {
  const subscriptions = await feathersClient.service('analytics').create({
    query: {
      projectTypeId,
      userAddress,
      enabled: true,
    },
  });
  return subscriptions.data.length > 0 ? Boolean(subscriptions.data[0]) : false;
};

/**
 *
 * @param projectTypeId: traceId, campaignId or communityId
 * @param enabled: boolean
 * @param projectType: 'campaign', 'community' or 'trace'
 * @returns {*}
 */
export const updateSubscription = ({ projectTypeId, enabled, projectType }) => {
  return feathersClient.service('subscriptions').create({
    projectType,
    enabled,
    projectTypeId,
  });
};
