import { useEffect, useRef, useState } from 'react';
import CampaignService from '../services/CampaignService';
import { history } from '../lib/helpers';
import ErrorHandler from '../lib/ErrorHandler';

const useCampaign = (id, slug) => {
  const [campaign, setCampaign] = useState({});
  const isMounted = useRef();

  useEffect(async () => {
    if (!id && !slug) return () => {};

    isMounted.current = true;

    try {
      const camp = id ? await CampaignService.get(id) : await CampaignService.getBySlug(slug);
      if (isMounted.current) setCampaign(camp);
    } catch (e) {
      console.log('error', e);
      ErrorHandler(e, 'Error on fetching campaign info');
      history.push('/notfound');
    }

    return () => {
      isMounted.current = false;
    };
  }, [id, slug]);

  return campaign;
};

export default useCampaign;
