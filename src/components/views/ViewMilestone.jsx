import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { utils } from 'web3';
import { paramsForServer } from 'feathers-hooks-common';
import Avatar from 'react-avatar';
import moment from 'moment';
import { Form } from 'formsy-react-components';

import { feathersClient } from './../../lib/feathersClient';
import { getUserName, getUserAvatar } from '../../lib/helpers';

import Loader from './../Loader';
import GoBackButton from '../GoBackButton';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ShowTypeDonations from '../ShowTypeDonations';
import getNetwork from './../../lib/blockchain/getNetwork';
import MilestoneItem from './../MilestoneItem';

import GivethWallet from '../../lib/blockchain/GivethWallet';
import User from '../../models/User';

/**
  Loads and shows a single milestone

  @route params:
    milestoneId (string): id of a milestone
* */

class ViewMilestone extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      isLoadingDonations: true,
      donations: [],
      etherScanUrl: '',
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
      });
    });
  }

  componentDidMount() {
    const { milestoneId } = this.props.match.params;

    feathersClient
      .service('milestones')
      .find({ query: { _id: milestoneId } })
      .then(resp =>
        this.setState(
          Object.assign({}, resp.data[0], {
            isLoading: false,
            hasError: false,
            totalDonated: utils.fromWei(resp.data[0].totalDonated),
            maxAmount: utils.fromWei(resp.data[0].maxAmount),
            id: milestoneId,
          }),
        ),
      )
      .catch(() => this.setState({ isLoading: false }));

    // lazy load donations
    // TODO fetch "non comitted" donations? add "intendedProjectId: milestoneId" to query to get
    // all "pending aproval" donations for this milestone
    const query = paramsForServer({
      query: { ownerId: milestoneId },
      schema: 'includeGiverDetails',
      $sort: { createdAt: -1 },
    });

    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(
        resp =>
          this.setState({
            donations: resp.data,
            isLoadingDonations: false,
          }),
        () => this.setState({ isLoadingDonations: false }),
      );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
  }

  isActiveMilestone() {
    return this.state.status === 'InProgress' && this.state.totalDonated < this.state.maxAmount;
  }

  render() {
    const { history, wallet, currentUser } = this.props;

    const {
      isLoading,
      id,
      projectId,
      title,
      description,
      image,
      donations,
      isLoadingDonations,
      ownerAddress,
      owner,
      maxAmount,
      totalDonated,
      recipient,
      recipientAddress,
      reviewer,
      reviewerAddress,
      etherScanUrl,
      items,
      date,
      fiatAmount,
      selectedFiatType,
    } = this.state;

    return (
      <div id="view-milestone-view">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div>
            <BackgroundImageHeader image={image} height={300}>
              <h6>Milestone</h6>
              <h1>{title}</h1>

              {!this.state.status === 'InProgress' && <p>This milestone is not active anymore</p>}

              {this.state.totalDonated >= this.state.maxAmount && (
                <p>This milestone has reached its funding goal.</p>
              )}

              {this.state.totalDonated < this.state.maxAmount && (
                <p>
                  Ξ{this.state.totalDonated} of Ξ{this.state.maxAmount} raised.
                </p>
              )}

              {this.isActiveMilestone() && (
                <DonateButton
                  type="milestone"
                  model={{ title, id, adminId: projectId }}
                  wallet={wallet}
                  currentUser={currentUser}
                  history={history}
                />
              )}
            </BackgroundImageHeader>

            <div className="container-fluid">
              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton history={history} />

                    <center>
                      <Link to={`/profile/${ownerAddress}`}>
                        <Avatar size={50} src={getUserAvatar(owner)} round />
                        <p className="small">{getUserName(owner)}</p>
                      </Link>
                    </center>

                    <div className="card content-card">
                      <div className="card-body content">
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {items &&
                items.length > 0 && (
                  <div className="row spacer-top-50 dashboard-table-view">
                    <div className="col-md-8 m-auto">
                      <h4>Milestone items</h4>

                      {/* MilesteneItem needs to be wrapped in a form or it won't mount */}
                      <Form>
                        <div className="table-container">
                          <table className="table table-responsive table-striped table-hover">
                            <thead>
                              <tr>
                                <th className="td-item-date">Date</th>
                                <th className="td-item-description">Description</th>
                                <th className="td-item-amount-fiat">Amount Fiat</th>
                                <th className="td-item-amount-ether">Amount Ether</th>
                                <th className="td-item-file-upload">Attached proof</th>
                                <th className="td-item-action" />
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, i) => (
                                <MilestoneItem name={`milestoneItem-${i}`} key={i} item={item} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Form>
                    </div>
                  </div>
                )}

              <div className="row spacer-top-50">
                <div className="col-md-8 m-auto">
                  <h4>Details</h4>

                  <div className="form-group">
                    <label>Reviewer</label>
                    <small className="form-text">
                      This person will review the actual completion of the Milestone
                    </small>

                    <table className="table-responsive">
                      <tbody>
                        <tr>
                          <td className="td-user">
                            <Link to={`/profile/${reviewerAddress}`}>
                              <Avatar size={30} src={getUserAvatar(reviewer)} round />
                              <span>{getUserName(reviewer)}</span>
                            </Link>
                          </td>
                          {etherScanUrl && (
                            <td className="td-address">
                              {' '}
                              -{' '}
                              <a href={`${etherScanUrl}address/${reviewerAddress}`}>
                                {reviewerAddress}
                              </a>
                            </td>
                          )}
                          {!etherScanUrl && <td className="td-address"> - {reviewerAddress}</td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="form-group">
                    <label>Recipient</label>
                    <small className="form-text">
                      Where the Ether goes after successful completion of the Milestone
                    </small>

                    <table className="table-responsive">
                      <tbody>
                        <tr>
                          <td className="td-user">
                            <Link to={`/profile/${recipientAddress}`}>
                              <Avatar size={30} src={getUserAvatar(recipient)} round />
                              <span>{getUserName(recipient)}</span>
                            </Link>
                          </td>
                          {etherScanUrl && (
                            <td className="td-address">
                              {' '}
                              -{' '}
                              <a href={`${etherScanUrl}address/${recipientAddress}`}>
                                {recipientAddress}
                              </a>
                            </td>
                          )}
                          {!etherScanUrl && <td className="td-address"> - {recipientAddress}</td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {date && (
                    <div className="form-group">
                      <label>Date of milestone</label>
                      <small className="form-text">
                        This date defines the eth-fiat conversion rate
                      </small>
                      {moment.utc(date).format('Do MMM YYYY')}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Max amount to raise</label>
                    <small className="form-text">
                      The maximum amount of &#926; (Ether) that can be donated to this Milestone.
                      Based on the requested amount in fiat.
                    </small>
                    &#926;{maxAmount}
                    {fiatAmount &&
                      items.length === 0 && (
                        <span>
                          {' '}
                          ({fiatAmount} {selectedFiatType})
                        </span>
                      )}
                  </div>

                  <div className="form-group">
                    <label>Amount donated</label>
                    <small className="form-text">
                      The amount of &#926; (Ether) currently donated to this Milestone
                    </small>
                    &#926;{totalDonated}
                  </div>

                  {/*
                    <div className="form-group">
                      <label>Completion deadline</label>
                      <small className="form-text">When the Milestone will be completed</small>
                      {completionDeadline}
                    </div>
                  */}
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  {this.isActiveMilestone() && (
                    <DonateButton
                      type="milestone"
                      model={{ title, id, adminId: projectId }}
                      wallet={wallet}
                      currentUser={currentUser}
                      history={history}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ViewMilestone.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(GivethWallet),
  match: PropTypes.shape({
    params: PropTypes.shape({
      milestoneId: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

ViewMilestone.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default ViewMilestone;
