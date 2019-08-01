import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';
import BigNumber from 'bignumber.js';

import NetworkWarning from 'components/NetworkWarning';
import { Consumer as Web3Consumer } from 'contextProviders/Web3Provider';
import { Consumer as WhiteListConsumer } from 'contextProviders/WhiteListProvider';

import MilestoneActions from 'components/MilestoneActions';
import { isLoggedIn } from 'lib/middleware';
import ErrorPopup from '../ErrorPopup';
import Loader from '../Loader';
import User from '../../models/User';
import {
  getTruncatedText,
  getReadableStatus,
  convertEthHelper,
  ANY_TOKEN,
} from '../../lib/helpers';
import config from '../../configuration';

import MilestoneService from '../../services/MilestoneService';
import Milestone from '../../models/Milestone';

const reviewDue = updatedAt =>
  moment()
    .subtract(3, 'd')
    .isAfter(moment(updatedAt));

/**
 * The my milestones view
 */
class MyMilestones extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      milestones: [],
      visiblePages: 10,
      itemsPerPage: 10,
      skipPages: 0,
      totalResults: 0,
      milestoneStatus: 'Active',
    };

    this.milestoneTabs = ['Active', 'Paid', 'Canceled', 'Rejected'];
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.getTokenSymbol = this.getTokenSymbol.bind(this);
  }

  componentDidMount() {
    this.updatePending = setInterval(() => {
      if (this.isPendingMilestone) {
        this.state.milestones
          .filter(m => m.confirmations !== m.requiredConfirmations)
          .forEach(m => {
            const currentMilestone = m;
            MilestoneService.get(m._id).then(newMilestone => {
              if (currentMilestone.confirmations !== newMilestone.confirmations)
                this.setState(prevState => ({
                  milestones: prevState.milestones.map(milestone =>
                    milestone._id === newMilestone._id ? newMilestone : milestone,
                  ),
                }));
            });
          });
      }
    }, 1000); // Fetch every seconds
    isLoggedIn(this.props.currentUser, true)
      .then(() => this.loadMileStones())
      .catch(err => {
        if (err === 'notLoggedIn') {
          ErrorPopup('You are not logged in.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isLoading: true });
      if (this.milestonesObserver) MilestoneService.unsubscribe();

      this.loadMileStones();
    }
  }

  componentWillUnmount() {
    if (this.updatePending) clearInterval(this.updatePending);
    MilestoneService.unsubscribe();
  }

  getTokenSymbol(token) {
    if (token.foreignAddress === ANY_TOKEN.foreignAddress) {
      return this.props.tokenWhitelist.map(t => t.symbol).join(', ');
    }
    return token.symbol;
  }

  loadMileStones() {
    const myAddress = this.props.currentUser.address;
    const { milestoneStatus, skipPages, itemsPerPage } = this.state;

    MilestoneService.subscribeMyMilestones({
      milestoneStatus,
      ownerAddress: myAddress,
      recipientAddress: myAddress,
      skipPages,
      itemsPerPage,
      onResult: resp =>
        this.setState({
          milestones: resp.data,
          itemsPerPage: resp.limit,
          skipPages: resp.skip,
          totalResults: resp.total,
          isLoading: false,
        }),
      onError: err => {
        ErrorPopup('Something went wrong.', err);
        // TO DO: handle error here in view
        this.setState({ isLoading: false });
      },
    });
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => this.loadMileStones());
  }

  changeTab(newStatus) {
    this.setState(
      {
        isLoading: true,
        milestoneStatus: newStatus,
        skipPages: 0,
      },
      () => {
        MilestoneService.unsubscribe();
        this.loadMileStones();
      },
    );
  }

  render() {
    const {
      milestones,
      isLoading,
      totalResults,
      skipPages,
      itemsPerPage,
      visiblePages,
    } = this.state;
    const { currentUser, balance } = this.props;
    this.isPendingMilestone =
      (milestones && milestones.some(m => m.confirmations !== m.requiredConfirmations)) || false;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork } }) => (
          <div id="milestones-view">
            <div className="container-fluid page-layout dashboard-table-view">
              <div className="row">
                <div className="col-md-10 m-auto">
                  <h1>Your Milestones</h1>

                  <NetworkWarning
                    incorrectNetwork={!isForeignNetwork}
                    networkName={config.foreignNetworkName}
                  />

                  <ul className="nav nav-tabs">
                    {this.milestoneTabs.map(st => (
                      <li className="nav-item" key={st}>
                        <span
                          role="button"
                          className={`nav-link ${this.state.loadedStatus === st ? 'active' : ''}`}
                          onKeyPress={() => this.changeTab(st)}
                          tabIndex={0}
                          onClick={() => this.changeTab(st)}
                        >
                          {st}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isLoading && <Loader className="fixed" />}

                  {!isLoading && (
                    <div className="table-container">
                      {milestones && milestones.length > 0 && (
                        <div>
                          <table className="table table-responsive table-striped table-hover">
                            <thead>
                              <tr>
                                {currentUser.authenticated && (
                                  <th className="td-actions">Actions</th>
                                )}
                                <th className="td-created-at">Created</th>
                                <th className="td-name">Name</th>
                                <th className="td-status">Status</th>
                                <th className="td-confirmations">
                                  {this.isPendingMilestone && 'Confirmations'}
                                </th>
                                <th className="td-donations-number">Requested</th>
                                <th className="td-donations-number">Donations</th>
                                <th className="td-donations-amount">Donated</th>
                                <th className="td-reviewer">Reviewer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {milestones.map(m => (
                                <tr key={m._id} className={m.status === 'Pending' ? 'pending' : ''}>
                                  {currentUser.authenticated && (
                                    <td className="td-actions">
                                      <MilestoneActions
                                        milestone={m}
                                        balance={balance}
                                        currentUser={currentUser}
                                      />
                                    </td>
                                  )}
                                  <td className="td-created-at">
                                    {m.createdAt && (
                                      <span>{moment.utc(m.createdAt).format('Do MMM YYYY')}</span>
                                    )}
                                  </td>
                                  <td className="td-name">
                                    <strong>
                                      <Link to={`/campaigns/${m.campaign._id}/milestones/${m._id}`}>
                                        MILESTONE <em>{getTruncatedText(m.title, 35)}</em>
                                      </Link>
                                    </strong>
                                    <br />
                                    <i className="fa fa-arrow-right" />
                                    <Link
                                      className="secondary-link"
                                      to={`/campaigns/${m.campaign._id}`}
                                    >
                                      CAMPAIGN <em>{getTruncatedText(m.campaign.title, 40)}</em>
                                    </Link>
                                  </td>
                                  <td className="td-status">
                                    {![Milestone.PROPOSED, Milestone.REJECTED].includes(m.status) &&
                                      (m.status === Milestone.PENDING || !m.mined) && (
                                        <span>
                                          <i className="fa fa-circle-o-notch fa-spin" />
                                          &nbsp;
                                        </span>
                                      )}
                                    {m.status === 'NeedsReview' && reviewDue(m.updatedAt) && (
                                      <span>
                                        <i className="fa fa-exclamation-triangle" />
                                        &nbsp;
                                      </span>
                                    )}
                                    {getReadableStatus(m.status)}
                                  </td>
                                  <td className="td-confirmations">
                                    {(this.isPendingMilestone ||
                                      m.requiredConfirmations !== m.confirmations) &&
                                      `${m.confirmations}/${m.requiredConfirmations}`}
                                  </td>
                                  <td className="td-donations-number">
                                    {m.isCapped && convertEthHelper(m.maxAmount)}{' '}
                                    {this.getTokenSymbol(m.token)}
                                  </td>
                                  <td className="td-donations-number">{m.totalDonations}</td>
                                  <td className="td-donations-">
                                    {m.isCapped && convertEthHelper(m.totalDonated)}{' '}
                                    {m.isCapped && m.token.symbol}
                                    {!m.isCapped && (
                                      <Link to={`/campaigns/${m.campaignId}/milestones/${m.id}`}>
                                        View Milestone
                                      </Link>
                                    )}
                                  </td>
                                  <td className="td-reviewer">
                                    {m.reviewer && m.reviewerAddress && (
                                      <Link to={`/profile/${m.reviewerAddress}`}>
                                        {m.reviewer.name || 'Anonymous user'}
                                      </Link>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {totalResults > itemsPerPage && (
                            <center>
                              <Pagination
                                activePage={Math.floor(skipPages / itemsPerPage) + 1}
                                itemsCountPerPage={itemsPerPage}
                                totalItemsCount={totalResults}
                                pageRangeDisplayed={visiblePages}
                                onChange={this.handlePageChanged}
                              />
                            </center>
                          )}
                        </div>
                      )}

                      {milestones && milestones.length === 0 && (
                        <div className="no-results">
                          <center>
                            <h3>No Milestones here!</h3>
                            <img
                              className="empty-state-img"
                              src={`${process.env.PUBLIC_URL}/img/delegation.svg`}
                              width="200px"
                              height="200px"
                              alt="no-milestones-icon"
                            />
                          </center>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Web3Consumer>
    );
  }
}

MyMilestones.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

MyMilestones.defaultProps = {
  currentUser: undefined,
};

export default props => (
  <WhiteListConsumer>
    {({ state: { tokenWhitelist } }) => <MyMilestones tokenWhitelist={tokenWhitelist} {...props} />}
  </WhiteListConsumer>
);
