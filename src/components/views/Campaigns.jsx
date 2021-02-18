import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CampaignCard from '../CampaignCard';
import Loader from '../Loader';
import CampaignService from '../../services/CampaignService';
import LoadMore from '../LoadMore';

/**
 * The Campaigns view mapped to /campaigns
 */
const Campaigns = ({ onlyRecent, step }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasError, setHasError] = useState(false);

  const isMounted = useRef(false);

  const loadMore = (init = false) => {
    if (init || (!isLoading && isMounted.current && total > campaigns.length)) {
      setLoading(true);
      CampaignService.getCampaigns(
        step, // Limit
        campaigns.length, // Skip
        onlyRecent,
        (_campaigns, _total) => {
          if (!isMounted.current) return;
          setCampaigns(campaigns.concat(_campaigns));
          setTotal(_total);
          setLoading(false);
        },
        () => {
          if (!isMounted.current) return;
          setHasError(true);
          setLoading(false);
        },
      );
    }
  };

  useEffect(() => {
    isMounted.current = true;
    loadMore(true);

    return () => {
      isMounted.current = false;
    };
  }, [onlyRecent]);

  return (
    <div id="campaigns-view" className="card-view">
      <div className="container-fluid page-layout reduced-padding">
        <h4>Campaigns {total > 0 && <span className="badge badge-success">{total}</span>}</h4>

        {// There are some Campaigns in the system, show them
        !hasError && campaigns.length > 0 && (
          <div>
            <p>
              These Campaigns work hard to solve causes. Help them realise their goals by giving
              Ether or tokens!
            </p>
            <div className="cards-grid-container">
              {campaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
            {campaigns.length < total && <LoadMore onClick={loadMore} disabled={isLoading} />}
          </div>
        )}
        {!hasError && isLoading && <Loader />}

        {// There are no Campaigns, show empty state
        !hasError && !isLoading && campaigns.length === 0 && (
          <div>
            <div className="text-center">
              <p>There are no Campaigns yet!</p>
              <img
                className="empty-state-img"
                src={`${process.env.PUBLIC_URL}/img/campaign.svg`}
                width="200px"
                height="200px"
                alt="no-campaigns-icon"
              />
            </div>
          </div>
        )}
        {hasError && (
          <p>
            <strong>Oops, something went wrong...</strong> The Giveth dapp could not load Campaigns
            for some reason. Please try refreshing the page...
          </p>
        )}
      </div>
    </div>
  );
};

Campaigns.propTypes = {
  step: PropTypes.number,
  onlyRecent: PropTypes.bool,
};

Campaigns.defaultProps = { step: 20, onlyRecent: false };

export default Campaigns;
