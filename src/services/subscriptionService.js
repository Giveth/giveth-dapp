import { feathersClient } from '../lib/feathersClient';

export const inquirySubscriptionStatus = ({ projectTypeId, userAddress }) => {
  const [subscription] = feathersClient.service('subscriptions').find({
    query: {
      projectTypeId,
      userAddress,
      enabled: true,
    },
  });
  return Boolean(subscription);
};

/**
 *
 * @param projectTypeId: milestoneId, campaignId or dacId
 * @param enabled: boolean
 * @param projectType: 'campaign', 'dac' or 'milestone'
 * @returns {*}
 */
export const updateSubscription = ({ projectTypeId, enabled, projectType }) => {
  return feathersClient.create('subscriptions').create({
    projectType,
    enabled,
    projectTypeId,
  });
};
