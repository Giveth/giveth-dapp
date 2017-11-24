import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';

import { feathersClient } from '../lib/feathersClient';

import DACs from './../components/views/DACs';
import Campaigns from './../components/views/Campaigns';
import Loader from './../components/Loader';

import User from './../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';
import DACservice from '../services/DAC';

/**
 * These routes load and keep DACs and Campaigns in state for faster switching of routes
 * This could some day move to Redux if needed
 */
class DataRoutes extends Component {
  constructor() {
    super();

    this.state = {
      dacs: {},
      campaigns: {},
      dacsLoading: true,
      campaignsLoading: true,
      hasError: false,
    };
  }

  componentWillMount() {
    // Load dacs and campaigns. When we receive first data, we finish loading.
    // This setup is a little ugly, bedac the callback is being called
    // again and again whenever data changes. Yet the promise will be resolved the first time.
    // But he, it works! ;-)

    // Load all the DACS
    DACservice.subscribe(
      dacs => this.setState({ dacs, dacsLoading: false }),
      () => this.setState({ hasError: true, dacsLoading: false }),
    );

    // Load all the campaigns
    feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
      query: {
        projectId: {
          $gt: '0', // 0 is a pending campaign
        },
        status: 'Active',
        $limit: 200,
        $sort: { milestonesCount: -1 },
      },
    }).subscribe(
      resp => this.setState({ campaigns: resp, campaignsLoading: false }),
      () => this.setState({ campaignsLoading: false, hasError: true }),
    );
  }

  render() {
    const { currentUser, wallet } = this.props;
    const {
      dacs, campaigns, dacsLoading, campaignsLoading, hasError,
    } = this.state;

    return (
      <div>
        {(dacsLoading || campaignsLoading) &&
          <Loader className="fixed" />
        }

        {!(dacsLoading || campaignsLoading) && !hasError &&
          <div>
            <Route
              exact
              path="/"
              render={props =>
                <DACs dacs={dacs} currentUser={currentUser} wallet={wallet} {...props} />}
            />
            <Route
              exact
              path="/dacs"
              render={props =>
                <DACs dacs={dacs} currentUser={currentUser} wallet={wallet} {...props} />}
            />
            <Route
              exact
              path="/campaigns"
              render={props => (<Campaigns
                campaigns={campaigns}
                currentUser={currentUser}
                wallet={wallet}
                {...props}
              />)}
            />
          </div>
        }

        { !(dacsLoading || campaignsLoading) && hasError &&
          <center>
            <h2>Oops, something went wrong...</h2>
            <p>The Giveth dapp could not load for some reason. Please try again...</p>
          </center>
        }

      </div>
    );
  }
}

DataRoutes.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(GivethWallet),
};

DataRoutes.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default DataRoutes;
