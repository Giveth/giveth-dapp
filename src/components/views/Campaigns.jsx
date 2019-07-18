import React from 'react';

import CampaignCard from '../CampaignCard';
import CampaignProvider, {
  Consumer as CampaignConsumer,
} from '../../contextProviders/CampaignProvider';
import Loader from '../Loader';

/**
 * The Campaigns view mapped to /campaigns
 */
const Campaigns = () => (
  <CampaignProvider>
    <CampaignConsumer>
      {({ state: { campaigns, isLoading, total, hasError } }) => (
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
              </div>
            )}
            {!hasError && isLoading && <Loader />}

            {// There are no Campaigns, show empty state
            !hasError && !isLoading && campaigns.length === 0 && (
              <div>
                <center>
                  <p>There are no Campaigns yet!</p>
                  <img
                    className="empty-state-img"
                    src={`${process.env.PUBLIC_URL}/img/campaign.svg`}
                    width="200px"
                    height="200px"
                    alt="no-campaigns-icon"
                  />
                </center>
              </div>
            )}
            {hasError && (
              <p>
                <strong>Oops, something went wrong...</strong> The Giveth dapp could not load
                Campaigns for some reason. Please try refreshing the page...
              </p>
            )}
          </div>
        </div>
      )}
    </CampaignConsumer>
  </CampaignProvider>
);

Campaigns.propTypes = {};

export default Campaigns;
