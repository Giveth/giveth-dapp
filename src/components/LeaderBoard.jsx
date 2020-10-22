import React, { Component, Fragment } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Loader from './Loader';
import { getUserName, getUserAvatar, roundBigNumber } from '../lib/helpers';
import Donation from '../models/Donation';
import DonationItem from './DonationItem';

/**
 * Shows a table of aggregateDonations for a given type (dac, campaign, milestone)
 */

class LeaderBoardItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showDetails: false,
    };

    this.toggleDetail = this.toggleDetail.bind(this);
  }

  toggleDetail() {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  }

  render() {
    const { d, rank, useAmountRemaining } = this.props;
    const { donations, totalAmount, giver } = d;
    const { showDetails } = this.state;
    const roundTotalAmount = roundBigNumber(totalAmount, 2).toFixed();

    return (
      <Fragment>
        <tr key={d._id} className={showDetails ? 'donation-item' : ''}>
          <td className="toggle-details">
            <button type="button" className="btn btn-sm" onClick={this.toggleDetail}>
              <i className={showDetails ? 'fa fa-minus' : 'fa fa-plus'} />
            </button>
          </td>
          <td className="font-weight-bold">{rank}</td>
          <td className="td-user">
            {giver && (
              <Link to={`/profile/${giver.address}`}>
                <Avatar size={30} src={getUserAvatar(giver)} round />
                <span> {getUserName(giver)}</span>
              </Link>
            )}
          </td>
          <td className="td-donations-amount font-weight-bold">${roundTotalAmount}</td>
          <td />
          <td className="" />
        </tr>
        {donations.map(dd => {
          const donation = new Donation(dd);
          return (
            <DonationItem
              key={donation._id}
              donation={donation}
              useAmountRemaining={useAmountRemaining}
              aggregatedDonation={d}
              showDetails={showDetails}
            />
          );
        })}
      </Fragment>
    );
  }
}

LeaderBoardItem.propTypes = {
  d: PropTypes.shape().isRequired,
  rank: PropTypes.number.isRequired,
  useAmountRemaining: PropTypes.bool.isRequired,
};

const LeaderBoard = props => {
  const { isLoading, aggregateDonations, loadMore, total, useAmountRemaining, children } = props;
  return (
    <div className="leader-board">
      <div className="leader-board-header">
        <h2>Leader Board</h2>
        <div className="donation-button">{children}</div>
      </div>

      <div className="dashboard-table-view">
        {isLoading && total === 0 && <Loader className="relative" />}
        {aggregateDonations.length > 0 && (
          <div className="table-container">
            <table className="table table-hover" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <th className="td-toggle" />
                  <th className="td-rank">Rank</th>
                  <th className="td-person">Person</th>
                  <th className="td-donations-amount">Total Donated</th>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <th className="td-donation-status" />
                  <th className="">Comment</th>
                </tr>
              </thead>
              <tbody>
                {aggregateDonations.map((d, index) => (
                  <LeaderBoardItem
                    d={d}
                    key={d._id}
                    rank={index + 1}
                    useAmountRemaining={useAmountRemaining}
                  />
                ))}
              </tbody>
            </table>
            {aggregateDonations.length < total && (
              <div className="load-more">
                <button
                  type="button"
                  className="btn"
                  onClick={() => loadMore()}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <span>
                      <i className="fa fa-circle-o-notch fa-spin" /> Loading
                    </span>
                  )}
                  {!isLoading && <span>Load more</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && aggregateDonations.length === 0 && (
          <p>No donations have been made yet. Be the first to donate now!</p>
        )}
      </div>
    </div>
  );
};

export default LeaderBoard;

LeaderBoard.propTypes = {
  aggregateDonations: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired,
  total: PropTypes.number.isRequired,
  loadMore: PropTypes.func.isRequired,
  useAmountRemaining: PropTypes.bool,
  children: PropTypes.node,
};

LeaderBoard.defaultProps = {
  useAmountRemaining: false,
  children: null,
};
