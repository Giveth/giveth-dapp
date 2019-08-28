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
import Milestone from '../models/Milestone';

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
    const { d, isSecondary, hasDetailsExpandColumn, hasProposedDelegation } = this.props;
    const totalColumns = 5 + (hasDetailsExpandColumn ? 1 : 0) + (hasProposedDelegation ? 1 : 0);
    const hasDetails = d.status === Donation.PAID;
    const detailRowId = `_detail_${d._id}`;
    const textColor = isSecondary ? 'text-white' : '';
    const linkColor = isSecondary ? 'text-warning' : '';
    return (
      <Fragment>
        <tr key={d._id}>
          {hasDetailsExpandColumn && (
            <td>
              {hasDetails ? (
                <button
                  type="button"
                  className="btn btn-info btn-sm"
                  onClick={this.toggleDetail}
                  data-toggle="collapse"
                  data-target={`#${detailRowId}`}
                  aria-controls={detailRowId}
                  aria-expanded="false"
                >
                  <i className={this.state.showDetails ? 'fa fa-minus' : 'fa fa-plus'} />
                </button>
              ) : null}
            </td>
          )}
          <td className="td-date">
            <span className={textColor}>{moment(d.createdAt).format('MM/DD/YYYY')}</span>
          </td>
          <td>
            <span className={textColor}>{d.statusDescription}</span>
          </td>

          <td className="td-donations-amount">
            <span className={textColor}>
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
            </span>
          </td>
          <td className="td-user">
            {d.giver && (
              <Link to={`/profile/${d.giver.address}`}>
                <Avatar size={30} src={getUserAvatar(d.giver)} round />
                <span className={linkColor}> {getUserName(d.giver)}</span>
              </Link>
            )}
          </td>
          {config.homeEtherscan ? (
            <td className="td-tx-address">
              <a
                href={`${config.homeEtherscan}address/${d.giverAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkColor}
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
          <tr className="">
            <td colSpan={totalColumns} className={this.state.showDetails ? '' : 'td-hidden-row'}>
              <div id={detailRowId} className="bg-secondary collapse ml-5">
                {this.state.parentsLoaded ? (
                  <ListDonations
                    donations={this.state.parents}
                    isLoading={false}
                    total={this.state.parents.length}
                    loadMore={() => {}}
                    newDonations={0}
                    isSecondary
                  />
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
  isSecondary: PropTypes.bool,
  hasDetailsExpandColumn: PropTypes.bool.isRequired,
};

ListDonationItem.defaultProps = {
  isSecondary: false,
};

const ListDonations = props => {
  const {
    isLoading,
    donations,
    loadMore,
    total,
    newDonations,
    useAmountRemaining,
    isSecondary,
  } = props;
  const hasProposedDelegation = props.donations.some(d => d.intendedProjectId);
  const hasDetailsExpandColumn = props.donations.some(d => d.status === Milestone.PAID);
  return (
    <div>
      {!isSecondary && (
        <div>
          <h2 style={{ display: 'inline-block' }}>Donations</h2>
          {newDonations > 0 && (
            <span className="badge badge-primary ml-2 mb-2" style={{ verticalAlign: 'middle' }}>
              {newDonations} new
            </span>
          )}
        </div>
      )}

      <div className="dashboard-table-view">
        {isLoading && total === 0 && <Loader className="relative" />}
        {donations.length > 0 && (
          <div className="table-container">
            <table className="table table-responsive table-hover" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  {hasDetailsExpandColumn && <th />}
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
                    isSecondary={isSecondary}
                    hasDetailsExpandColumn={hasDetailsExpandColumn}
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
  isSecondary: PropTypes.bool,
};

ListDonations.defaultProps = {
  newDonations: 0,
  useAmountRemaining: false,
  isSecondary: false,
};
