import React, { Component, Fragment } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

import config from 'configuration';
import Loader from './Loader';
import { getUserName, getUserAvatar, convertEthHelper, roundBigNumber } from '../lib/helpers';
import Donation from '../models/Donation';

/**
 * Shows a table of aggregateDonations for a given type (dac, campaign, milestone)
 */

class LeaderBoardItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showDetails: false,
      itemType: null, // Delegated ro Directly donated
      hasHistory: this.props.d.status === Donation.PAID, // PAID donations always has history
    };

    this.toggleDetail = this.toggleDetail.bind(this);
    this.setItemType = this.setItemType.bind(this);
    this.setItemHasHistory = this.setItemHasHistory.bind(this);
  }

  setItemType(type) {
    this.setState({
      itemType: type,
    });
  }

  setItemHasHistory(hasHistory) {
    this.setState({
      hasHistory,
    });
  }

  toggleDetail() {
    this.setState(prevState => ({
      ...prevState,
      showDetails: !prevState.showDetails,
    }));
  }

  render() {
    const { d, rank, useAmountRemaining } = this.props;
    const { donations, totalAmount, giver } = d;
    const roundTotalAmount = roundBigNumber(totalAmount, 2).toFixed();
    // debugger;
    return (
      <Fragment>
        <tr key={d._id}>
          <td>
            <button type="button" className="btn btn-info btn-sm" onClick={this.toggleDetail}>
              <i className={this.state.showDetails ? 'fa fa-minus' : 'fa fa-plus'} />
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
          let typeLabel;
          let etherScanLink = '';
          const { etherscan, homeEtherscan } = config;
          switch (this.state.itemType) {
            case 'delegated':
              typeLabel = (
                <span className="badge badge-info">
                  <i className="fa fa-random " />
                  Delegated
                </span>
              );
              break;
            case 'direct':
              typeLabel = (
                <span className="badge badge-warning">
                  <i className="fa fa-plug" />
                  Direct
                </span>
              );
              break;
            default:
              typeLabel = null;
          }

          if (d.status === Donation.PAID || this.state.itemType === 'delegated') {
            etherScanLink = etherscan && d.txHash ? `${etherscan}tx/${d.txHash}` : '';
          } else if (this.state.itemType === 'direct') {
            etherScanLink =
              homeEtherscan && d.homeTxHash ? `${homeEtherscan}tx/${d.homeTxHash}` : '';
          }
          return (
            <tr key={donation._id} style={this.state.showDetails ? {} : { display: 'none' }}>
              <td>&nbsp;</td>
              <td className="td-date">
                <span>{moment(donation.createdAt).format('MM/DD/YYYY')}</span>
              </td>
              <td className="td-donations-amount">
                <span>
                  {donation.isPending && (
                    <span>
                      <i className="fa fa-circle-o-notch fa-spin" />
                      &nbsp;
                    </span>
                  )}
                  {convertEthHelper(
                    donation.status !== Donation.PAID && useAmountRemaining
                      ? donation.amountRemaining
                      : donation.amount,
                    donation.token && donation.token.decimals,
                  )}{' '}
                  {(donation.token && donation.token.symbol) || config.nativeTokenName}
                </span>
              </td>
              <td>${donation.usdValue}</td>
              <td>
                {etherScanLink ? (
                  <a href={etherScanLink} target="_blank" rel="noopener noreferrer">
                    {donation.statusDescription}
                  </a>
                ) : (
                  <span>{donation.statusDescription}</span>
                )}
                {typeLabel}
              </td>
              <td />
            </tr>
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
  const {
    isLoading,
    aggregateDonations,
    loadMore,
    total,
    newDonations,
    useAmountRemaining,
    children,
  } = props;
  return (
    <div>
      <div>
        <h2 style={{ display: 'inline-block' }}>Leader Board</h2>
        <div className="pull-right">{children}</div>
        {newDonations > 0 && (
          <span className="badge badge-primary ml-2 mb-2" style={{ verticalAlign: 'middle' }}>
            {newDonations} new
          </span>
        )}
      </div>

      <div className="dashboard-table-view">
        {isLoading && total === 0 && <Loader className="relative" />}
        {aggregateDonations.length > 0 && (
          <div className="table-container">
            <table className="table table-hover" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <th />
                  <th className="td-date">Rank</th>
                  <th>Person</th>
                  <th colSpan="2" className="td-donations-amount">
                    Total Donated
                  </th>
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
              <center>
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={() => loadMore()}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <span>
                      <i className="fa fa-circle-o-notch fa-spin" /> Loading
                    </span>
                  )}
                  {!isLoading && <span>Load More</span>}
                </button>
              </center>
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
  newDonations: PropTypes.number,
  useAmountRemaining: PropTypes.bool,
  children: PropTypes.node,
};

LeaderBoard.defaultProps = {
  newDonations: 0,
  useAmountRemaining: false,
  children: null,
};
