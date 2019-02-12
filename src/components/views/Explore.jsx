import React, { Fragment } from 'react';

import { Consumer as Web3Consumer } from '../../contextProviders/Web3Provider';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { history } from '../../lib/helpers';
import DACs from './DACs';
import Campaigns from './Campaigns';
import Milestones from './Milestones';

import JoinGivethCommunity from '../JoinGivethCommunity';

const Explore = () => (
  <div>
    <Web3Consumer>
      {({ state: { balance } }) => (
        <UserConsumer>
          {({ state: { currentUser } }) => (
            <Fragment>
              <JoinGivethCommunity currentUser={currentUser} balance={balance} history={history} />

              <DACs />
              <Campaigns />
              <Milestones currentUser={currentUser} balance={balance} />
            </Fragment>
          )}
        </UserConsumer>
      )}
    </Web3Consumer>
  </div>
);

Explore.propTypes = {};

export default Explore;
