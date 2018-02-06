import React from 'react';
import PropTypes from 'prop-types';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import JoinGivethCommunity from '../JoinGivethCommunity';
import DacCard from '../DacCard';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import User from '../../models/User';
import DAC from '../../models/DAC';

/**
 * The DACs view mapped to /dacs
 *
 * @param dacs         List of all campaigns with navigation information
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
const DACs = ({ currentUser, wallet, dacs, history }) => (
  <div id="dacs-view" className="card-view">
    <JoinGivethCommunity currentUser={currentUser} wallet={wallet} history={history} />

    <div className="container-fluid page-layout reduced-padding">
      {// There are some Campaigns in the system, show them
      dacs.data &&
        dacs.data.length > 0 && (
          <div>
            <center>
              <p>
                These Communities are solving causes. Help them realise their goals by joining them
                and giving Ether!
              </p>
            </center>

            <ResponsiveMasonry
              columnsCountBreakPoints={{
                350: 1,
                750: 2,
                900: 3,
                1024: 3,
                1470: 4,
              }}
            >
              <Masonry gutter="10px">
                {dacs.data.map(dac => (
                  <DacCard
                    key={dac.id}
                    dac={dac}
                    removeDAC={this.removeDAC}
                    currentUser={currentUser}
                    wallet={wallet}
                    history={history}
                  />
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </div>
        )}

      {// There are no Campaigns, show empty state
      dacs.data &&
        dacs.data.length === 0 && (
          <div>
            <center>
              <p>There are no decentralized altruistic communities (DACs) yet!</p>
              <img
                className="empty-state-img"
                src={`${process.env.PUBLIC_URL}/img/community.svg`}
                width="200px"
                height="200px"
                alt="no-dacs-icon"
              />
            </center>
          </div>
        )}
    </div>
  </div>
);

DACs.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  dacs: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.instanceOf(DAC)),
    limit: PropTypes.number.isRequired,
    skip: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  history: PropTypes.shape({}).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet),
};

DACs.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default DACs;
