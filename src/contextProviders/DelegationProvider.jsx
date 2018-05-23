import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';

import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from '../components/ErrorPopup';

// Models
import Donation from '../models/Donation';
import User from '../models/User';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 * Delegations provider listing given user's delegations and actions on top of them
 *
 * @prop currentUser User for whom the list of delegations should be retrieved
 * @prop children    Child REACT components
 */
class DelegationProvider extends Component {
  constructor() {
    super();

    this.state = {
      delegations: [],
      dacs: [],
      campaigns: [],
      milestones: [],
      isLoading: true,
    };

    this.getAndWatchDonations = this.getAndWatchDonations.bind(this);
  }

  componentWillMount() {
    if (this.props.currentUser) {
      /**
        Load all DACs/campaigns/milestones
        TO DO: We should really move this to a single service

        For each type we transform the data so that the InputToken component can handle it
        * */

      // FIXME: Move all of this to single service in feathers
      Promise.all([
        new Promise((resolve, reject) => {
          this.dacsObserver = feathersClient
            .service('dacs')
            .watch({ listStrategy: 'always' })
            .find({
              query: {
                delegateId: { $gt: '0' },
                $select: ['ownerAddress', 'title', '_id', 'delegateId'],
              },
            })
            .subscribe(
              resp =>
                this.setState(
                  {
                    dacs: resp.data.map(c => {
                      c.type = 'dac';
                      c.name = c.title;
                      c.id = c._id; // eslint-disable-line no-underscore-dangle
                      c.element = (
                        <span>
                          {c.title} <em>DAC</em>
                        </span>
                      );
                      return c;
                    }),
                  },
                  resolve(),
                ),
              () => reject(),
            );
        }),
        new Promise((resolve, reject) => {
          this.campaignsObserver = feathersClient
            .service('campaigns')
            .watch({ listStrategy: 'always' })
            .find({
              query: {
                projectId: {
                  $gt: '0',
                },
                status: 'Active',
                $select: ['ownerAddress', 'title', '_id', 'projectId'],
              },
            })
            .subscribe(
              resp =>
                this.setState(
                  {
                    campaigns: resp.data.map(c => {
                      c.type = 'campaign';
                      c.name = c.title;
                      c.id = c._id; // eslint-disable-line no-underscore-dangle
                      c.element = (
                        <span>
                          {c.title} <em>Campaign</em>
                        </span>
                      );
                      return c;
                    }),
                  },
                  resolve(),
                ),
              () => reject(),
            );
        }),
        new Promise((resolve, reject) => {
          this.milestoneObserver = feathersClient
            .service('milestones')
            .watch({ listStrategy: 'always' })
            .find({
              query: {
                projectId: { $gt: '0' },
                status: 'InProgress',
                $select: [
                  'title',
                  '_id',
                  'projectId',
                  'campaignId',
                  'maxAmount',
                  'totalDonated',
                  'status',
                ],
              },
            })
            .subscribe(
              resp => {
                this.setState(
                  {
                    milestones: resp.data.map(m => {
                      m.type = 'milestone';
                      m.name = m.title;
                      m.id = m._id; // eslint-disable-line no-underscore-dangle
                      m.element = (
                        <span>
                          {m.title} <em>Milestone</em>
                        </span>
                      );
                      return m;
                    }), // .filter((m) => m.totalDonated < m.maxAmount)
                  },
                  resolve(),
                );
              },
              () => reject(),
            );
        }),
      ])
        .then(() => this.getAndWatchDonations())
        .catch(err => {
          ErrorPopup('Unable to load dacs, campaigns or milestones.', err);
          this.setState({ isLoading: false });
        });
    }
  }

  componentWillUnmount() {
    // Clean up the observers
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
    if (this.dacsObserver) this.dacsObserver.unsubscribe();
    if (this.campaignsObserver) this.campaignsObserver.unsubscribe();
    if (this.milestoneObserver) this.milestoneObserver.unsubscribe();
  }

  getAndWatchDonations() {
    // here we get all the ids.
    // TO DO: less overhead here if we move it all to a single service.
    // NOTE: This will not rerun, meaning after any dac/campaign/milestone is added

    const dacsIds = this.state.dacs
      .filter(c => c.ownerAddress === this.props.currentUser.address)
      .map(c => c._id); // eslint-disable-line no-underscore-dangle

    const campaignIds = this.state.campaigns
      .filter(c => c.ownerAddress === this.props.currentUser.address)
      .map(c => c._id); // eslint-disable-line no-underscore-dangle

    const query = paramsForServer({
      query: {
        $or: [
          { ownerId: { $in: campaignIds } },
          { delegateId: { $in: dacsIds } },
          {
            ownerId: this.props.currentUser.address,
            $not: { delegateId: { $gt: '0' } },
          },
        ],
        status: {
          $in: ['waiting', 'committed'],
        },
        $sort: { createdAt: 1 },
      },
      schema: 'includeTypeAndGiverDetails',
    });

    // start watching donations, this will re-run when donations change or are added
    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(
        resp => {
          this.setState({
            delegations: resp.data.map(d => new Donation(d)),
            isLoading: false,
          });
        },
        () => this.setState({ isLoading: false }),
      );
  }

  render() {
    const { delegations, milestones, campaigns, isLoading, etherScanUrl } = this.state;
    const { refund, commit, reject } = this;

    return (
      <Provider
        value={{
          state: {
            delegations,
            milestones,
            campaigns,
            isLoading,
            etherScanUrl,
          },
          actions: {
            refund,
            commit,
            reject,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

DelegationProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  currentUser: PropTypes.instanceOf(User),
};

DelegationProvider.defaultProps = {
  currentUser: undefined,
};

export default DelegationProvider;
