import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { Link } from 'react-router-dom';
import { paramsForServer } from 'feathers-hooks-common';
import Avatar from 'react-avatar';
import moment from 'moment';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import { isAuthenticated } from '../../lib/middleware';
import DelegateButton from '../../components/DelegateButton';
import currentUserModel from '../../models/currentUserModel';
import { getUserName, getUserAvatar, getTruncatedText } from '../../lib/helpers';

/**
 * The my delegations view
 */
class Delegations extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      dacs: [],
      campaigns: [],
      milestones: [],
      delegations: [],
    };
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet).then(() => {
      /**
      Load all DACs/campaigns/milestones
      TO DO: We should really move this to a single service

      For each type we transform the data so that the InputToken component can handle it
      * */

      Promise.all([
        new Promise((resolve, reject) => {
          this.dacsObserver = feathersClient.service('dacs').watch({ strategy: 'always' }).find({ query: { delegateId: { $gt: '0' }, $select: ['ownerAddress', 'title', '_id', 'delegateId'] } }).subscribe(
            resp =>
              this.setState({
                dacs: resp.data.map((c) => {
                  c.type = 'dac';
                  c.name = c.title;
                  c.id = c._id; // eslint-disable-line no-underscore-dangle
                  c.element = <span>{c.title} <em>DAC</em></span>;
                  return c;
                }),
              }, resolve()),
            () => reject(),
          );
        }),
        new Promise((resolve, reject) => {
          this.campaignsObserver = feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
            query: {
              projectId: {
                $gt: '0',
              },
              status: 'Active',
              $select: ['ownerAddress', 'title', '_id', 'projectId'],
            },
          }).subscribe(
            resp =>
              this.setState({
                campaigns: resp.data.map((c) => {
                  c.type = 'campaign';
                  c.name = c.title;
                  c.id = c._id; // eslint-disable-line no-underscore-dangle
                  c.element = <span>{c.title} <em>Campaign</em></span>;
                  return c;
                }),

              }, resolve()),
            () => reject(),
          );
        }),
        new Promise((resolve, reject) => {
          this.milestoneObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({
            query: {
              projectId: { $gt: '0' },
              status: 'InProgress',
              $select: ['title', '_id', 'projectId', 'campaignId', 'maxAmount', 'totalDonated', 'status'],
            },
          }).subscribe(
            (resp) => {
              this.setState({
                milestones: resp.data.map((m) => {
                  m.type = 'milestone';
                  m.name = m.title;
                  m.id = m._id; // eslint-disable-line no-underscore-dangle
                  m.element = <span>{m.title} <em>Milestone</em></span>;
                  return m;
                }), // .filter((m) => m.totalDonated < m.maxAmount)
              }, resolve());
            },
            () => reject(),
          );
        }),
      ]).then(() => this.getAndWatchDonations())
        .catch(() => this.setState({ isLoading: false }));
    });
  }

  componentWillUnmount() {
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
          { ownerId: this.props.currentUser.address, $not: { delegateId: { $gt: '0' } } },
        ],
        status: {
          $in: ['waiting', 'committed'],
        },
        $sort: { createdAt: 1 },
      },
      schema: 'includeTypeAndGiverDetails',
    });

      // start watching donations, this will re-run when donations change or are added
    this.donationsObserver = feathersClient.service('donations').watch({ listStrategy: 'always' }).find(query).subscribe(
      (resp) => {
        this.setState({
          delegations: resp.data,
          isLoading: false,
        });
      },
      () => this.setState({ isLoading: false }),
    );
  }

  render() {
    const { wallet, currentUser, history } = this.props;
    const {
      delegations, isLoading, campaigns, milestones,
    } = this.state;

    return (
      <div id="delegations-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">

              { (isLoading || (delegations && delegations.length > 0)) &&
              <h1>Your delegations</h1>
                }

              { isLoading &&
              <Loader className="fixed" />
                }

              { !isLoading &&
              <div>
                { delegations && delegations.length > 0 &&

                <table className="table table-responsive table-striped table-hover">
                  <thead>
                    <tr>
                      <th className="td-date">Date</th>
                      <th className="td-donated-to">Donated to</th>
                      <th className="td-donations-amount">Amount</th>
                      <th className="td-user">Received from</th>
                      <th className="td-tx-address">Address</th>
                      <th className="td-status">Status</th>
                      <th className="td-actions" />
                    </tr>
                  </thead>
                  <tbody>
                    { delegations.map((d, index) =>
                            (
                              <tr key={index}>
                                <td className="td-date">{moment(d.createdAt).format('MM/DD/YYYY')}</td>

                                {d.delegate > 0 &&
                                <td className="td-donated-to">
                                  <Link
                                    to={`/dacs/${d._id}`} // eslint-disable-line no-underscore-dangle
                                  >
                                    DAC <em>{getTruncatedText(d.delegateEntity.title, 45)}</em>
                                  </Link>
                                </td>
                              }
                                {!d.delegate &&
                                <td className="td-donated-to">
                                  <Link
                                    to={`/${d.ownerType}s/${d.ownerEntity._id}`} // eslint-disable-line no-underscore-dangle
                                  >
                                    {d.ownerType.toUpperCase()} <em>{d.ownerEntity.title}</em>
                                  </Link>
                                </td>
                              }
                                <td className="td-donations-amount">
                                &#926;{utils.fromWei(d.amount)}
                                </td>
                                <td className="td-user">
                                  <Avatar size={30} src={getUserAvatar(d.giver)} round />
                                  {getUserName(d.giver)}
                                </td>
                                <td className="td-tx-address">{d.giverAddress}</td>
                                <td className="td-status">{d.status}</td>
                                <td className="td-actions">

                                  {/* When donated to a dac, allow delegation
                                  to campaigns and milestones */}
                                  {(d.delegate > 0 || d.ownerId === currentUser.address) &&
                                  <DelegateButton
                                    types={campaigns.concat(milestones)}
                                    model={d}
                                    wallet={wallet}
                                    history={history}
                                  />
                                }

                                  {/* When donated to a campaign, only allow delegation
                                  to milestones of that campaign */}
                                  {d.ownerType === 'campaign' &&
                                  <DelegateButton
                                    types={milestones.filter(m => m.campaignId === d.ownerId)}
                                    model={d}
                                    milestoneOnly
                                    wallet={wallet}
                                    history={history}
                                  />
                                }

                                </td>
                              </tr>))}

                  </tbody>

                </table>
                    }

                { delegations && delegations.length === 0 &&
                <div>
                  <center>
                    <h3>There&apos;s nothing to delegate yet!</h3>
                    <img className="empty-state-img" src={`${process.env.PUBLIC_URL}/img/delegation.svg`} width="200px" height="200px" alt="no-delegations-icon" />
                  </center>
                </div>
                    }

              </div>
                }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Delegations.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.shape({}).isRequired,
  wallet: PropTypes.shape({}).isRequired,
};

Delegations.defaultProps = {
  currentUser: undefined,
};

export default Delegations;
