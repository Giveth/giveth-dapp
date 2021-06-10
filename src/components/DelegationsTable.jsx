import React from 'react';
import Pagination from 'react-js-pagination';
import PropTypes from 'prop-types';
import DelegationsItem from './DelegationsItem';
import { Donation, Trace } from '../models';
import Campaign from '../models/Campaign';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

function DelegationsTable({
  delegations,
  campaigns,
  traces,
  totalResults,
  skipPages,
  itemsPerPage,
  pageRangeDisplayed,
  handlePageChanged,
}) {
  return (
    <div className="dashboard-table-view">
      {delegations && delegations.length > 0 && (
        <div className="table-container">
          <table className="table table-responsive table-striped table-hover">
            <thead>
              <tr>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <th className="td-actions" />
                <th className="td-date">Date</th>
                <th className="td-donated-to">Donated to</th>
                <th className="td-donations-amount">Amount</th>
                <th className="td-user">Received from</th>
                <th className="td-tx-address">Address</th>
                <th className="td-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {delegations.map(d => (
                <DelegationsItem key={d.id} donation={d} campaigns={campaigns} traces={traces} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {delegations && totalResults > itemsPerPage && (
        <div className="text-center">
          <Pagination
            activePage={skipPages + 1}
            itemsCountPerPage={itemsPerPage}
            totalItemsCount={totalResults}
            pageRangeDisplayed={pageRangeDisplayed}
            onChange={handlePageChanged}
          />
        </div>
      )}
      {delegations && delegations.length === 0 && (
        <div>
          <div className="text-center">
            <h3>There&apos;s nothing to delegate (yet)!</h3>
            <img
              className="empty-state-img"
              src={`${process.env.PUBLIC_URL}/img/delegation.svg`}
              width="200px"
              height="200px"
              alt="no-delegations-icon"
            />
          </div>
        </div>
      )}
    </div>
  );
}

DelegationsTable.propTypes = {
  delegations: PropTypes.arrayOf(PropTypes.instanceOf(Donation)).isRequired,
  campaigns: PropTypes.arrayOf(PropTypes.instanceOf(Campaign)).isRequired,
  traces: PropTypes.arrayOf(
    PropTypes.oneOfType([Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf)),
  ).isRequired,
  totalResults: PropTypes.number.isRequired,
  skipPages: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  pageRangeDisplayed: PropTypes.number.isRequired,
  handlePageChanged: PropTypes.func.isRequired,
};

export default React.memo(DelegationsTable);
