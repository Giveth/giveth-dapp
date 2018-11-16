import React from 'react';

import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { history } from '../../lib/helpers';
import DACs from './DACs';
import Campaigns from './Campaigns';

import JoinGivethCommunity from '../JoinGivethCommunity';

const Explore = () => (
  <div>
    <UserConsumer>
      {({ state: { wallet, currentUser } }) => (
        <JoinGivethCommunity currentUser={currentUser} wallet={wallet} history={history} />
      )}
    </UserConsumer>

    <Campaigns />
    <DACs />
  </div>
);

Explore.propTypes = {};

export default Explore;
