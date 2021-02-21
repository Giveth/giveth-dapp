import { useEffect, useState } from 'react';
import CampaignService from '../services/CampaignService';

export default function useCampaign(campaignId) {
  const [campaign, setCampaign] = useState();

  useEffect(async () => {
    async function getCampaign() {
      const camp = await CampaignService.get(campaignId);
      setCampaign(camp);
    }
    getCampaign();
  }, []);

  return campaign;
}
