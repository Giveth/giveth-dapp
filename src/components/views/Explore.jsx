import React from 'react';

import { history } from '../../lib/helpers';
import DACs from './DACs';
import Campaigns from './Campaigns';
import Milestones from './Milestones';

import JoinGivethCommunity from '../JoinGivethCommunity';

const Explore = () => (
  <div>
    <JoinGivethCommunity history={history} />

    <DACs onlyRecent />
    <Campaigns onlyRecent />
    <Milestones />
  </div>
);

Explore.propTypes = {};

export default Explore;
