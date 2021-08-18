import { notification } from 'antd';
import { TraceService } from '../services';
import { history, txNotification } from './helpers';
import { sendAnalyticsTracking } from './SegmentAnalytics';
import ErrorHandler from './ErrorHandler';

export const TraceSave = props => {
  const {
    web3,
    trace,
    campaign,
    from,
    afterSave,
    onError,
    userIsCampaignOwner,
    minPayoutWarningInCreatEdit,
  } = props;

  const _afterSave = (txUrl, res) => {
    const analyticsData = {
      traceId: res._id,
      slug: res.slug,
      parentCampaignAddress: campaign.ownerAddress,
      recipientAddress: res.recipientAddress,
      title: trace.title,
      ownerAddress: trace.ownerAddress,
      traceType: trace.formType,
      parentCampaignId: campaign.id,
      parentCampaignTitle: campaign.title,
      reviewerAddress: trace.reviewerAddress,
      userAddress: from,
    };

    if (!userIsCampaignOwner) {
      txNotification(`${trace.formType} proposed to the Campaign owner`, false, true);
      sendAnalyticsTracking(trace.id ? 'Trace Edit' : 'Trace Create', {
        action: trace.id ? 'updated proposed' : 'proposed',
        ...analyticsData,
      });
    } else if (txUrl) {
      txNotification(`Your ${trace.formType} is pending....`, txUrl, true);
      sendAnalyticsTracking(trace.id ? 'Trace Edit' : 'Trace Create', {
        action: 'created',
        ...analyticsData,
      });
    } else {
      const notificationError = `It seems your ${trace.formType} has been ${
        trace.id ? 'updated' : 'created'
      }!, this should not be happened`;
      notification.error({ message: '', description: notificationError });
    }

    history.push(`/trace/${res.slug}`);
    afterSave();
  };

  const _afterMined = txUrl =>
    txNotification(`Your ${trace.formType} has been ${trace.id ? 'updated' : 'created'}!`, txUrl);

  const _onError = (message, err, isLessThanMinPayout) => {
    if (isLessThanMinPayout) minPayoutWarningInCreatEdit();
    else ErrorHandler(err, message);
    onError();
  };

  TraceService.save({
    trace,
    from,
    afterSave: _afterSave,
    afterMined: _afterMined,
    onError: _onError,
    web3,
  }).then();
};
