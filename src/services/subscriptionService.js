import { feathersClient } from '../lib/feathersClient';

export const inquirySubscriptionStatus = async ({ projectTypeId, userAddress }) => {
  const subscriptions = await feathersClient.service('subscriptions').find({
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
 * @param projectTypeId: milestoneId, campaignId or dacId
 * @param enabled: boolean
 * @param projectType: 'campaign', 'dac' or 'milestone'
 * @returns {*}
 */
export const updateSubscription = ({ projectTypeId, enabled, projectType }) => {
  return feathersClient.service('subscriptions').create({
    projectType,
    enabled,
    projectTypeId,
  });
};
