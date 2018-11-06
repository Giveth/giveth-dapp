import React from 'react';
import PropTypes from 'prop-types';

import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { Consumer as Web3Consumer } from '../../contextProviders/Web3Provider';

import JoinGivethCommunity from '../JoinGivethCommunity';
import DacCard from '../DacCard';
import DAC from '../../models/DAC';

/**
 * The DACs view mapped to /dacs
 *
 * @param dacs         List of all campaigns with navigation information
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 */
const DACs = ({ dacs, history }) => (
  <Web3Consumer>
    {({ state: { balance } }) => (
      <UserConsumer>
        {({ state: { currentUser } }) => (
          <div id="dacs-view" className="card-view">
            <JoinGivethCommunity currentUser={currentUser} balance={balance} history={history} />

            <div className="container-fluid page-layout reduced-padding">
              {// There are some Campaigns in the system, show them
              dacs.data &&
                dacs.data.length > 0 && (
                  <div>
                    <center>
                      <p>
                        These Communities are solving causes. Help them realise their goals by
                        joining them and giving Ether!
                      </p>
                    </center>
                    <div className="cards-grid-container">
                      {dacs.data.map(dac => (
                        <DacCard
                          key={dac.id}
                          dac={dac}
                          removeDAC={this.removeDAC}
                          currentUser={currentUser}
                          balance={balance}
                          history={history}
                        />
                      ))}
                    </div>
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
        )}
      </UserConsumer>
    )}
  </Web3Consumer>
);

DACs.propTypes = {
  dacs: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.instanceOf(DAC)),
    limit: PropTypes.number.isRequired,
    skip: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  history: PropTypes.shape({}).isRequired,
};

export default DACs;
