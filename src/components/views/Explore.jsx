import React from 'react';

import { history } from '../../lib/helpers';
import Communities from './Communities';
import Campaigns from './Campaigns';
import Traces from './Traces';

import JoinGivethCommunity from '../JoinGivethCommunity';

const Explore = () => (
  <div>
    <JoinGivethCommunity history={history} />

    <Communities onlyRecent />
    <Campaigns onlyRecent />
    <Traces />
  </div>
);

Explore.propTypes = {};

export default Explore;
