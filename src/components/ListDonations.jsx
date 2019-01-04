import React, { Fragment } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

import config from 'configuration';
import Loader from './Loader';
import { getUserName, getUserAvatar, convertEthHelper } from '../lib/helpers';
import Donation from '../models/Donation';

/**
 * Shows a table of donations for a given type (dac, campaign, milestone)
 */
const ListDonations = props => {
  const hasProposedDelegation = props.donations.some(d => d.intendedProjectId);
  return (
    <div>
      {props.isLoading && <Loader className="small" />}

      {!props.isLoading && (
        <Fragment>
          <h4>Donations</h4>

          <div className="dashboard-table-view">
            {props.donations &&
              props.donations.length > 0 && (
                <div className="table-container">
                  <table
                    className="table table-responsive table-hover"
                    style={{ marginTop: 0, marginBottom: '50px' }}
                  >
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
                      {props.donations.map(d => (
                        <tr key={d._id}>
                          <td className="td-date">{moment(d.createdAt).format('MM/DD/YYYY')}</td>
                          <td>{d.statusDescription}</td>

                          <td className="td-donations-amount">
                            {d.isPending && (
                              <span>
                                <i className="fa fa-circle-o-notch fa-spin" />
                                &nbsp;
                              </span>
                            )}
                            {convertEthHelper(d.amount)} {(d.token && d.token.symbol) || 'ETH'}
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
                              <a href={`${config.homeEtherscan}address/${d.giverAddress}`}>
                                {d.giverAddress}
                              </a>
                            </td>
                          ) : (
                            <td className="td-tx-address">{d.giverAddress}</td>
                          )}
                          {hasProposedDelegation && (
                            <td className="td-commit">
                              {d.commitTime ? moment(d.commitTime).format('lll') : 'Committed'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {props.donations &&
              props.donations.length === 0 && (
                <p>No donations have been made yet. Be the first to donate now!</p>
              )}
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default ListDonations;

ListDonations.propTypes = {
  donations: PropTypes.arrayOf(PropTypes.instanceOf(Donation)).isRequired,
  isLoading: PropTypes.bool.isRequired,
};
