import React, { Component, Fragment } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

import config from 'configuration';
import Milestone from 'models/Milestone';
import Loader from './Loader';
import { getUserName, getUserAvatar, convertEthHelper } from '../lib/helpers';
import Donation from '../models/Donation';
import DonationHistory from './DonationHistory';

/**
 * Shows a table of donations for a given type (dac, campaign, milestone)
 */

class DonationListItem extends Component {
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
      showDetails: !prevState.showDetails,
    }));
  }

  render() {
    const { d, hasProposedDelegation } = this.props;
    const totalColumns = 6 + (hasProposedDelegation ? 1 : 0);
    let typeLabel;
    let historyClassName = '';
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

    if (d.status === Donation.PAID && d.bridgeStatus === Donation.PAID) {
      etherScanLink = `${homeEtherscan}tx/${d.bridgeTxHash}`;
    } else if (d.status === Donation.PAID || this.state.itemType === 'delegated') {
      etherScanLink = etherscan && d.txHash ? `${etherscan}tx/${d.txHash}` : '';
    } else if (this.state.itemType === 'direct') {
      etherScanLink = homeEtherscan && d.homeTxHash ? `${homeEtherscan}tx/${d.homeTxHash}` : '';
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
            {etherScanLink ? (
              <a href={etherScanLink} target="_blank" rel="noopener noreferrer">
                {d.statusDescription}
              </a>
            ) : (
              <span>{d.statusDescription}</span>
            )}
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
            {d.giverAddress && (
              <Link to={`/profile/${d.giverAddress}`}>
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
          <td className="td-user">{d.comment}</td>
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

DonationListItem.propTypes = {
  d: PropTypes.instanceOf(Donation).isRequired,
  hasProposedDelegation: PropTypes.bool.isRequired,
  useAmountRemaining: PropTypes.bool.isRequired,
};

const DonationList = props => {
  const { isLoading, donations, loadMore, total, newDonations, useAmountRemaining, status } = props;
  const hasProposedDelegation = props.donations.some(d => d.intendedProjectId);
  return (
    <div>
      <div>
        {newDonations > 0 && (
          <span className="badge badge-primary ml-2 mb-2" style={{ verticalAlign: 'middle' }}>
            {newDonations} new
          </span>
        )}
      </div>

      <div className="dashboard-table-view">
        {isLoading && total === 0 && <Loader className="relative" />}
        {donations.length > 0 && (
          <div className="table-container" style={{ marginTop: 0, marginBottom: '50px' }}>
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
                  <th className="">Comment</th>
                  {hasProposedDelegation && <th className="td-commit">Commit Time</th>}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <DonationListItem
                    d={d}
                    key={d._id}
                    hasProposedDelegation={hasProposedDelegation}
                    useAmountRemaining={useAmountRemaining}
                  />
                ))}
              </tbody>
            </table>
            {donations.length < total && (
              <div className="text-center">
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
              </div>
            )}
          </div>
        )}

        {!isLoading && donations.length === 0 && status === Milestone.IN_PROGRESS && (
          <p>No donations have been made yet. Be the first to donate now!</p>
        )}
      </div>
    </div>
  );
};

export default DonationList;

DonationList.propTypes = {
  donations: PropTypes.arrayOf(PropTypes.instanceOf(Donation)).isRequired,
  isLoading: PropTypes.bool.isRequired,
  total: PropTypes.number.isRequired,
  loadMore: PropTypes.func.isRequired,
  newDonations: PropTypes.number,
  useAmountRemaining: PropTypes.bool,
  status: PropTypes.string,
};

DonationList.defaultProps = {
  newDonations: 0,
  useAmountRemaining: false,
  status: '',
};
