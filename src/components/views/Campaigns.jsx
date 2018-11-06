import React from 'react';
import PropTypes from 'prop-types';

import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { Consumer as Web3Consumer } from '../../contextProviders/Web3Provider';

import JoinGivethCommunity from '../JoinGivethCommunity';
import CampaignCard from '../CampaignCard';
import Campaign from '../../models/Campaign';

/**
 * The Campaigns view mapped to /campaigns
 *
 * @param campaigns    List of all campaigns with navigation information
 * @param history      Browser history object
 */
const Campaigns = ({ campaigns, history }) => (
  <Web3Consumer>
    {({ state: { balance } }) => (
      <UserConsumer>
        {({ state: { currentUser } }) => (
          <div id="campaigns-view" className="card-view">
            <JoinGivethCommunity currentUser={currentUser} balance={balance} history={history} />

            <div className="container-fluid page-layout reduced-padding">
              {// There are some Campaigns in the system, show them
              campaigns.data &&
                campaigns.data.length > 0 && (
                  <div>
                    <center>
                      <p>
                        These Campaigns work hard to solve causes. Help them realise their goals by
                        giving Ether!
                      </p>
                    </center>
                    <div className="cards-grid-container">
                      {campaigns.data.map(campaign => (
                        <CampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          history={history}
                          balance={balance}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {// There are no Campaigns, show empty state
              campaigns.data &&
                campaigns.data.length === 0 && (
                  <div>
                    <center>
                      <p>There are no campaigns yet!</p>
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
            </div>
          </div>
        )}
      </UserConsumer>
    )}
  </Web3Consumer>
);

Campaigns.propTypes = {
  history: PropTypes.shape({}).isRequired,
  campaigns: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.instanceOf(Campaign)),
    limit: PropTypes.number.isRequired,
    skip: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

export default Campaigns;
