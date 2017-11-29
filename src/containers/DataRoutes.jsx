import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';

import DACs from './../components/views/DACs';
import Campaigns from './../components/views/Campaigns';
import Loader from './../components/Loader';

import User from './../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';
import DACservice from '../services/DAC';
import CampaignService from '../services/Campaign';

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
    // Load all the DACS
    this.dacsObserver = DACservice.subscribe(
      dacs => this.setState({ dacs, dacsLoading: false }),
      () => this.setState({ hasError: true, dacsLoading: false }),
    );

    // Load all the campaigns
    this.campaignObserver = CampaignService.subscribe(
      campaigns => this.setState({ campaigns, campaignsLoading: false }),
      () => this.setState({ campaignsLoading: false, hasError: true }),
    );
  }

  componentWillUnmount() {
    if (this.dacsObserver) this.dacsObserver.unsubscribe();
    if (this.campaignObserver) this.campaignObserver.unsubscribe();
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
