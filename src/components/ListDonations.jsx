import React, { Component, Fragment } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

import config from 'configuration';
import Loader from './Loader';
import { getUserName, getUserAvatar, convertEthHelper } from '../lib/helpers';
import Donation from '../models/Donation';
import DonationService from '../services/DonationService';

/**
 * Shows a table of donations for a given type (dac, campaign, milestone)
 */

class ListDonationItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showDetails: false,
      parentsLoaded: false,
      parents: undefined,
    };

    this.toggleDetail = this.toggleDetail.bind(this);
  }

  loadParents() {
    if (!this.state.parentsLoaded) {
      const { d } = this.props;
      DonationService.getDonationCommittedParents(d, parents => {
        console.log(parents);
        this.setState({ parentsLoaded: true, parents });
      });
    }
  }

  toggleDetail() {
    if (!this.state.showDetails) {
      this.loadParents();
    }

    this.setState(prevState => ({
      ...prevState,
      showDetails: !prevState.showDetails,
    }));
  }

  render() {
    const { d } = this.props;
    const totalColumns = this.props.hasProposedDelegation ? 6 : 5;
    const hasDetails = d.status === Donation.PAID;
    const detailRowId = `_detail_${d._id}`;
    return (
      <Fragment>
        <tr key={d._id}>
          <td className="td-date">{moment(d.createdAt).format('MM/DD/YYYY')}</td>
          <td>
            {d.statusDescription}
            {hasDetails && (
              <button
                type="button"
                className="btn btn-link btn-sm"
                onClick={this.toggleDetail}
                data-toggle="collapse"
                data-target={`#${detailRowId}`}
                aria-controls={detailRowId}
                aria-expanded="false"
              >
                {this.state.showDetails ? 'hide details' : 'show details'}
              </button>
            )}
          </td>

          <td className="td-donations-amount">
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
            )}{' '}
            {(d.token && d.token.symbol) || config.nativeTokenName}
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
        {hasDetails && (
          <tr>
            <td colSpan={totalColumns} className={this.state.showDetails ? '' : 'td-hidden-row'}>
              <div id={detailRowId} className="collapse">
                {this.state.parentsLoaded ? (
                  'Demo1'
                ) : (
                  <div className="text-center">
                    <div className="spinner-grow text-info" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
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
