import React from 'react';
import PropTypes from 'prop-types';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import JoinGivethCommunity from '../JoinGivethCommunity';
import currentUserModel from '../../models/currentUserModel';
import CampaignCard from '../CampaignCard';

/**
  The Campaigns view mapped to /campaigns

  @param campaigns    List of all campaigns with navigation information
  @param currentUser  Currently logged in user information
  @param history      History stack
  @param wallet       Wallet object with the balance and all keystores
*/
const Campaigns = ({
  campaigns, currentUser, history, wallet,
}) => (
  <div id="campaigns-view" className="card-view">
    <JoinGivethCommunity
      currentUser={currentUser}
      wallet={wallet}
      history={history}
    />

    <div className="container-fluid page-layout reduced-padding">

      { // There are some Campaigns in the system, show them
        campaigns.data && campaigns.data.length > 0 &&
        <div>
          <center>
            <p>
              These campaigns work hard to solve causes.
              Help them realise their goals by giving Ether!
            </p>
          </center>

          <ResponsiveMasonry columnsCountBreakPoints={{
            350: 1,
            750: 2,
            900: 3,
            1024: 4,
            1470: 5,
          }}
          >
            <Masonry gutter="10px">
              { campaigns.data.map(campaign =>
                    (<CampaignCard
                      key={campaign._id} // eslint-disable-line no-underscore-dangle
                      campaign={campaign}
                      currentUser={currentUser}
                      wallet={wallet}
                      history={history}
                    />
                  ))}
            </Masonry>
          </ResponsiveMasonry>
        </div>
          }

      { // There are no Campaigns, show empty state
        campaigns.data && campaigns.data.length === 0 &&
        <div>
          <center>
            <p>There are no campaigns yet!</p>
            <img className="empty-state-img" src={`${process.env.PUBLIC_URL}/img/campaign.svg`} width="200px" height="200px" alt="no-campaigns-icon" />
          </center>
        </div>
          }

    </div>
  </div>
);

Campaigns.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.shape({}).isRequired,
  wallet: PropTypes.shape({}).isRequired,
  campaigns: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
    })),
    limit: PropTypes.number.isRequired,
    skip: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

Campaigns.defaultProps = {
  currentUser: {},
};

export default Campaigns;
