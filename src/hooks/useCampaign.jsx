import { useEffect, useState } from 'react';
import CampaignService from '../services/CampaignService';
import { history } from '../lib/helpers';
import ErrorHandler from '../lib/ErrorHandler';

const useCampaign = (id, slug) => {
  const [campaign, setCampaign] = useState({});

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const camp = id ? await CampaignService.get(id) : await CampaignService.getBySlug(slug);
        setCampaign(camp);
      } catch (e) {
        console.log('error', e);
        ErrorHandler(e, 'Error on fetching campaign info');
        history.push('/notfound');
      }
    };

    if (id || slug) fetchCampaign().then();
  }, [id, slug]);

  return campaign;
};

export default useCampaign;
