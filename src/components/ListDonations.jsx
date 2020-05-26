import React, { Component, Fragment } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

import config from 'configuration';
import Loader from './Loader';
import { getUserName, getUserAvatar, convertEthHelper } from '../lib/helpers';
import Donation from '../models/Donation';
import DonationHistory from './DonationHistory';

/**
 * Shows a table of donations for a given type (dac, campaign, milestone)
 */

class ListDonationItem extends Component {
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
    const { d, hasProposedDelegation } = this.props;
    const totalColumns = 6 + (hasProposedDelegation ? 1 : 0);
    let typeLabel;
    let historyClassName = '';
    switch (this.state.itemType) {
      case 'delegated':
        typeLabel = (
          <span className="badge badge-info">
            <i className="fa fa-random " />
            Delegated
          </span>
        );
        historyClassName = 'table-info';
        break;
      case 'direct':
        typeLabel = (
          <span className="badge badge-warning">
            <i className="fa fa-plug" />
            Direct
          </span>
        );
        historyClassName = 'table-warning';
        break;
      default:
        typeLabel = null;
    }
    return (
      <Fragment>
        <tr key={d._id}>
          <td>
            {this.state.hasHistory ? (
              <button type="button" className="btn btn-info btn-sm" onClick={this.toggleDetail}>
                <i className={this.state.showDetails ? 'fa fa-minus' : 'fa fa-plus'} />
              </button>
            ) : null}
          </td>
          <td className="td-date">
            <span>{moment(d.createdAt).format('MM/DD/YYYY')}</span>
          </td>
          <td>
            <span>{d.statusDescription}</span>
            {typeLabel}
          </td>
          <td className="td-donations-amount">
            <span>
              {d.isPending && (
                <span>
                  <i className="fa fa-circle-o-notch fa-spin" />
                  &nbsp;
                </span>
              )}
              {convertEthHelper(
                d.status !== Donation.PAID && this.props.useAmountRemaining
                  ? d.amountRemaining
                  : d.amount,
                d.token && d.token.decimals,
              )}{' '}
              {(d.token && d.token.symbol) || config.nativeTokenName}
            </span>
          </td>
          <td className="td-user">
            {d.giver && (
              <Link to={`/profile/${d.giver.address}`}>
                <Avatar size={30} src={getUserAvatar(d.giver)} round />
                <span> {getUserName(d.giver)}</span>
              </Link>
            )}
          </td>
          {config.homeEtherscan ? (
            <td className="td-tx-address">
              <a
                href={`${config.homeEtherscan}address/${d.giverAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.giverAddress}
              </a>
            </td>
          ) : (
            <td className="td-tx-address">{d.giverAddress}</td>
          )}
          {this.props.hasProposedDelegation && (
            <td className="td-commit">
              {d.commitTime ? moment(d.commitTime).format('lll') : 'Committed'}
            </td>
          )}
        </tr>

        <tr style={this.state.showDetails ? {} : { display: 'none' }}>
          <td>&nbsp;</td>
          <td colSpan={totalColumns} className={historyClassName}>
            <DonationHistory
              donation={d}
              setItemType={this.setItemType}
              setItemHasHistory={this.setItemHasHistory}
            />
          </td>
        </tr>
      </Fragment>
    );
  }
}

ListDonationItem.propTypes = {
  d: PropTypes.instanceOf(Donation).isRequired,
  hasProposedDelegation: PropTypes.bool.isRequired,
  useAmountRemaining: PropTypes.bool.isRequired,
};

const ListDonations = props => {
  const { isLoading, donations, loadMore, total, newDonations, useAmountRemaining } = props;
  const hasProposedDelegation = props.donations.some(d => d.intendedProjectId);
  return (
    <div>
      <div>
        <h2 style={{ display: 'inline-block' }}>Donations</h2>
        {newDonations > 0 && (
          <span className="badge badge-primary ml-2 mb-2" style={{ verticalAlign: 'middle' }}>
            {newDonations} new
          </span>
        )}
      </div>

      <div className="dashboard-table-view">
        {isLoading && total === 0 && <Loader className="relative" />}
        {donations.length > 0 && (
          <div className="table-container">
            <table className="table table-responsive table-hover" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <th />
                  <th className="td-date">Date</th>
                  <th>Status</th>
                  <th className="td-donations-amount">Amount</th>
                  <th className="td-user">Name</th>
                  <th className="td-tx-address">Address</th>
                  {hasProposedDelegation && <th className="td-commit">Commit Time</th>}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <ListDonationItem
                    d={d}
                    key={d._id}
                    hasProposedDelegation={hasProposedDelegation}
                    useAmountRemaining={useAmountRemaining}
                  />
                ))}
              </tbody>
            </table>
            {donations.length < total && (
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

        {!isLoading && donations.length === 0 && (
          <p>No donations have been made yet. Be the first to donate now!</p>
        )}
      </div>
    </div>
  );
};

export default ListDonations;

ListDonations.propTypes = {
  donations: PropTypes.arrayOf(PropTypes.instanceOf(Donation)).isRequired,
  isLoading: PropTypes.bool.isRequired,
  total: PropTypes.number.isRequired,
  loadMore: PropTypes.func.isRequired,
  newDonations: PropTypes.number,
  useAmountRemaining: PropTypes.bool,
};

ListDonations.defaultProps = {
  newDonations: 0,
  useAmountRemaining: false,
};
