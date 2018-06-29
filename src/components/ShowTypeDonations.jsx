import React, { Component } from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';

import Loader from './Loader';
import getNetwork from '../lib/blockchain/getNetwork';
import { getUserName, getUserAvatar, convertEthHelper } from '../lib/helpers';
import User from '../models/User';

/**
 * Shows a table of donations for a given type (dac, campaign, milestone)
 */
// TODO: Remove once rewritten to model
/* eslint no-underscore-dangle: 0 */
class ShowTypeDonations extends Component {
  constructor() {
    super();

    this.state = {
      etherScanUrl: '',
    };
  }

  componentDidMount() {
    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
      });
    });
  }

  render() {
    const { isLoading, donations } = this.props;
    const { etherScanUrl } = this.state;

    return (
      <div>
        {isLoading && <Loader className="small" />}

        {!isLoading && (
          <div className="dashboard-table-view">
            {donations &&
              donations.length > 0 && (
                <div className="table-container">
                  <table className="table table-responsive table-hover">
                    <thead>
                      <tr>
                        <th className="td-date">Date</th>
                        <th className="td-donations-amount">Amount</th>
                        <th className="td-user">Name</th>
                        <th className="td-tx-address">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map(d => (
                        <tr key={d._id}>
                          <td className="td-date">{moment(d.createdAt).format('MM/DD/YYYY')}</td>

                          <td className="td-donations-amount">{convertEthHelper(d.amount)} ETH</td>
                          <td className="td-user">
                            {d.giver && <Avatar size={30} src={getUserAvatar(d.giver)} round />}
                            <span>{getUserName(d.giver)}</span>
                          </td>
                          {etherScanUrl && d.giver ? (
                            <td className="td-tx-address">
                              <a href={`${etherScanUrl}address/${d.giver.address}`}>
                                {d.giver.address}
                              </a>
                            </td>
                          ) : (
                            <td className="td-tx-address">{d.giver && d.giver.address}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {donations &&
              donations.length === 0 && (
                <p>No donations have been made yet. Be the first to donate now!</p>
              )}
          </div>
        )}
      </div>
    );
  }
}

export default ShowTypeDonations;

ShowTypeDonations.propTypes = {
  donations: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      amount: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      delegateType: PropTypes.string,
      currentUser: PropTypes.instanceOf(User),
      giverAddress: PropTypes.string.isRequired,
      ownerId: PropTypes.string.isRequired,
      ownerType: PropTypes.string.isRequired,
      txHash: PropTypes.string.isRequired,
    }),
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
};
