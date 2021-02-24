import { useEffect, useRef, useState } from 'react';
import CampaignService from '../services/CampaignService';

const useCampaign = campaignId => {
  const [campaign, setCampaign] = useState();
  const isMounted = useRef();

  useEffect(async () => {
    isMounted.current = true;

    const camp = await CampaignService.get(campaignId);
    if (isMounted.current) setCampaign(camp);

    return () => {
      isMounted.current = false;
    };
  }, [campaignId]);

  return campaign;
};

export default useCampaign;
