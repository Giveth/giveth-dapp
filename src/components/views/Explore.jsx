import React from 'react';
import { Helmet } from 'react-helmet';

import { history } from '../../lib/helpers';
import { CommunitiesRecent } from './Communities';
import { CampaignsRecent } from './Campaigns';
import Traces from './Traces';

import JoinGivethCommunity from '../JoinGivethCommunity';

const Explore = () => (
  <div>
    <Helmet>
      <title>Giveth Trace</title>
    </Helmet>
    <JoinGivethCommunity history={history} />

    <CommunitiesRecent />
    <CampaignsRecent />
    <Traces />
  </div>
);

Explore.propTypes = {};

export default Explore;
