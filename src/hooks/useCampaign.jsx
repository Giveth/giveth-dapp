import { useEffect, useRef, useState } from 'react';
import CampaignService from '../services/CampaignService';
import { history } from '../lib/helpers';
import ErrorHandler from '../lib/ErrorHandler';

const useCampaign = campaignId => {
  const [campaign, setCampaign] = useState({});
  const isMounted = useRef();

  useEffect(async () => {
    if (!campaignId) return () => {};

    isMounted.current = true;

    try {
      const camp = await CampaignService.get(campaignId);
      if (isMounted.current) setCampaign(camp);
    } catch (e) {
      console.log('error', e);
      ErrorHandler(e, 'Error on fetching campaign info');
      history.push('/notfound');
    }

    return () => {
      isMounted.current = false;
    };
  }, [campaignId]);

  return campaign;
};

export default useCampaign;
