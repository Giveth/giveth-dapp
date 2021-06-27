import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { utils } from 'web3';
import ErrorPopup from '../ErrorPopup';

import { checkBalance } from '../../lib/middleware';
import { getTruncatedText, convertEthHelper, history } from '../../lib/helpers';

import Loader from '../Loader';

import User from '../../models/User';
import CommunityService from '../../services/CommunityService';
import Community from '../../models/Community';
import AuthenticationWarning from '../AuthenticationWarning';

/**
 * The my communities view
 */
class MyCommunities extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      communities: {},
      visiblePages: 10,
      skipPages: 0,
      itemsPerPage: 50,
    };

    this.editCommunity = this.editCommunity.bind(this);
    this.handlePageChanged = this.handlePageChanged.bind(this);
  }

  componentDidMount() {
    if (this.props.currentUser) {
      this.loadCommunities();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isLoading: true });
      if (this.communitiesObserver) this.communitiesObserver.unsubscribe();
      this.loadCommunities();
    }
  }

  componentWillUnmount() {
    if (this.communitiesObserver) this.communitiesObserver.unsubscribe();
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => this.loadCommunities());
  }

  loadCommunities() {
    this.communitiesObserver = CommunityService.getUserCommunities(
      this.props.currentUser.address,
      this.state.skipPages,
      this.state.itemsPerPage,
      communities => this.setState({ communities, isLoading: false }),
      () => this.setState({ isLoading: false }),
    );
  }

  editCommunity(id) {
    checkBalance(this.props.balance)
      .then(() => {
        history.push(`/communities/${id}/edit`);
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  render() {
    const { communities, isLoading, visiblePages } = this.state;
    const isPendingCommunity =
      (communities.data &&
        communities.data.some(d => d.confirmations !== d.requiredConfirmations)) ||
      false;

    return (
      <div id="communities-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">
              {(isLoading || (communities && communities.data.length > 0)) && (
                <h1>Your Communities</h1>
              )}

              <AuthenticationWarning />

              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  {communities && communities.data.length > 0 && (
                    <div>
                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                            <th className="td-actions" />
                            <th className="td-name">Name</th>
                            <th className="td-donations-number">Donations</th>
                            <th className="td-donations-amount">Amount</th>
                            <th className="td-status">Status</th>
                            <th className="td-confirmations">
                              {isPendingCommunity && 'Confirmations'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {communities.data.map(d => (
                            <tr
                              key={d.id}
                              className={d.status === Community.PENDING ? 'pending' : ''}
                            >
                              <td className="td-actions">
                                <button
                                  type="button"
                                  className="btn btn-link"
                                  onClick={() => this.editCommunity(d.id)}
                                >
                                  <i className="fa fa-edit" />
                                </button>
                              </td>
                              <td className="td-name">
                                <Link to={`/community/${d.slug}`}>
                                  {getTruncatedText(d.title, 45)}
                                </Link>
                              </td>
                              <td className="td-donations-number">
                                {d.donationCounters.length > 0 &&
                                  d.donationCounters.map(counter => (
                                    <p key={`donations_count-${d.key}-${counter.symbol}`}>
                                      {counter.donationCount} donation(s) in {counter.symbol}
                                    </p>
                                  ))}
                                {d.donationCounters.length === 0 && <span>-</span>}
                              </td>
                              <td className="td-donations-amount">
                                {d.donationCounters.length > 0 &&
                                  d.donationCounters.map(counter => (
                                    <p key={`total_donated-${d.key}-${counter.symbol}`}>
                                      {convertEthHelper(counter.totalDonated, counter.decimals)}{' '}
                                      {counter.symbol}
                                    </p>
                                  ))}

                                {d.donationCounters.length === 0 && <span>-</span>}
                              </td>
                              <td className="td-status">
                                {d.status === Community.PENDING && (
                                  <span>
                                    <i className="fa fa-circle-o-notch fa-spin" />
                                    &nbsp;
                                  </span>
                                )}
                                {d.status}
                              </td>
                              <td className="td-confirmations">
                                {(isPendingCommunity ||
                                  d.requiredConfirmations !== d.confirmations) &&
                                  `${d.confirmations}/${d.requiredConfirmations}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {communities.total > communities.limit && (
                        <center>
                          <Pagination
                            activePage={communities.skip + 1}
                            itemsCountPerPage={communities.limit}
                            totalItemsCount={communities.total}
                            pageRangeDisplayed={visiblePages}
                            onChange={this.handlePageChanged}
                          />
                        </center>
                      )}
                    </div>
                  )}

                  {communities && communities.data.length === 0 && (
                    <div>
                      <center>
                        <h3>You haven&apos;t created any Communities yet!</h3>
                        <img
                          className="empty-state-img"
                          src={`${process.env.PUBLIC_URL}/img/community.svg`}
                          width="200px"
                          height="200px"
                          alt="no-communities-icon"
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
    );
  }
}

MyCommunities.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.objectOf(utils.BN).isRequired,
};

export default MyCommunities;
