import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';

import Milestone from 'models/Milestone';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from '../components/ErrorPopup';

// Models
import Donation from '../models/Donation';
import User from '../models/User';
import DAC from '../models/DAC';
import Campaign from '../models/Campaign';

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
      visiblePages: 10,
      itemsPerPage: 50,
      skipPages: 0,
      totalResults: 0,
    };

    this.getAndWatchDonations = this.getAndWatchDonations.bind(this);
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.load = this.load.bind(this);
    this.cleanUp = this.cleanUp.bind(this);
  }

  componentDidMount() {
    if (this.props.currentUser) {
      this.load();
    }
  }

  componentWillUnmount() {
    this.cleanUp();
  }

  getAndWatchDonations() {
    // here we get all the ids.
    // TODO: less overhead here if we move it all to a single service.
    // NOTE: This will not rerun, meaning after any dac/campaign/milestone is added

    const dacsIds = this.state.dacs
      .filter(c => c.ownerAddress === this.props.currentUser.address)
      .map(c => c._id);

    const campaignIds = this.state.campaigns
      .filter(c => c.ownerAddress === this.props.currentUser.address)
      .map(c => c._id);

    const query = paramsForServer({
      query: {
        lessThanCutoff: { $ne: true },
        $or: [
          { ownerTypeId: { $in: campaignIds }, status: Donation.COMMITTED },
          {
            delegateTypeId: { $in: dacsIds },
            status: { $in: [Donation.WAITING, Donation.TO_APPROVE] },
          },
          {
            ownerTypeId: this.props.currentUser.address,
            delegateId: { $exists: false },
            status: Donation.WAITING,
          },
          // {
          // ownerTypeId: this.props.currentUser.address,
          // delegateTypeId: { $gt: 0 },
          // },
        ],
        $sort: { createdAt: 1 },
        $limit: this.state.itemsPerPage,
        $skip: this.state.skipPages * this.state.itemsPerPage,
      },
      schema: 'includeTypeAndGiverDetails',
    });

    // start watching donations, this will re-run when donations change or are added
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(
        resp => {
          this.setState(prevState => ({
            delegations: resp.data.map(d => new Donation(d)),
            skipPages: resp.skip / prevState.itemsPerPage,
            totalResults: resp.total,
            isLoading: false,
          }));
        },
        () => this.setState({ isLoading: false }),
      );
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => {
      this.getAndWatchDonations();
    });
  }

  load() {
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
              status: DAC.ACTIVE,
              $select: ['ownerAddress', 'title', '_id', 'delegateId'],
              $limit: 100,
              $sort: {
                createdAt: -1,
              },
            },
          })
          .subscribe(
            resp =>
              this.setState(
                {
                  dacs: resp.data.map(d => {
                    d.type = DAC.type;
                    d.name = d.title;
                    d.id = d._id;
                    d.element = (
                      <span>
                        {d.title} <em>DAC</em>
                      </span>
                    );
                    return d;
                  }),
                },
                resolve(),
              ),
            err => reject(err),
          );
      }),
      new Promise((resolve, reject) => {
        this.campaignsObserver = feathersClient
          .service('campaigns')
          .watch({ listStrategy: 'always' })
          .find({
            query: {
              status: Campaign.ACTIVE,
              $select: ['ownerAddress', 'title', '_id', 'projectId'],
              $limit: 100,
              $sort: {
                createdAt: -1,
              },
            },
          })
          .subscribe(
            resp =>
              this.setState(
                {
                  campaigns: resp.data.map(c => new Campaign(c)),
                },
                resolve(),
              ),
            err => reject(err),
          );
      }),
      new Promise((resolve, reject) => {
        this.milestoneObserver = feathersClient
          .service('milestones')
          .watch({ listStrategy: 'always' })
          .find({
            query: {
              status: Milestone.IN_PROGRESS,
              fullyFunded: { $ne: true },
              $select: [
                'title',
                '_id',
                'projectId',
                'campaignId',
                'maxAmount',
                'status',
                'token',
                'donationCounters',
              ],
              $limit: 100,
              $sort: {
                createdAt: -1,
              },
            },
          })
          .subscribe(
            resp => {
              this.setState(
                {
                  milestones: resp.data.map(m => new Milestone(m)),
                },
                resolve(),
              );
            },
            err => reject(err),
          );
      }),
    ])
      .then(() => this.getAndWatchDonations())
      .catch(err => {
        ErrorPopup('Unable to load dacs, Campaigns or Milestones.', err);
        this.setState({ isLoading: false });
      });
  }

  cleanUp() {
    // Clean up the observers
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
    if (this.dacsObserver) this.dacsObserver.unsubscribe();
    if (this.campaignsObserver) this.campaignsObserver.unsubscribe();
    if (this.milestoneObserver) this.milestoneObserver.unsubscribe();
  }

  render() {
    const {
      delegations,
      milestones,
      campaigns,
      isLoading,
      etherScanUrl,
      itemsPerPage,
      visiblePages,
      totalResults,
      skipPages,
    } = this.state;
    const { refund, commit, reject, handlePageChanged } = this;

    return (
      <Provider
        value={{
          state: {
            delegations,
            milestones,
            campaigns,
            isLoading,
            etherScanUrl,
            itemsPerPage,
            visiblePages,
            totalResults,
            skipPages,
          },
          actions: {
            refund,
            commit,
            reject,
            handlePageChanged,
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
