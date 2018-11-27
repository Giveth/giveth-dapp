import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import moment from 'moment';
import Pagination from 'react-js-pagination';

import NetworkWarning from 'components/NetworkWarning';
import { Consumer as Web3Consumer } from 'contextProviders/Web3Provider';
import config from 'configuration';

import Loader from '../Loader';
import DelegateButton from '../DelegateButton';
import { getUserName, getUserAvatar, convertEthHelper } from '../../lib/helpers';

import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import DelegationProvider, {
  Consumer as DelegationConsumer,
} from '../../contextProviders/DelegationProvider';

/**
 * The my delegations view
 */
const Delegations = ({ balance }) => (
  <Web3Consumer>
    {({ state: { isForeignNetwork } }) => (
      <UserConsumer>
        {({ state: { currentUser } }) => (
          <DelegationProvider currentUser={currentUser}>
            <DelegationConsumer>
              {({
                state: {
                  isLoading,
                  delegations,
                  campaigns,
                  milestones,
                  totalResults,
                  visiblePages,
                  skipPages,
                  itemsPerPage,
                },
                actions: { handlePageChanged },
              }) => (
                <div id="delegations-view">
                  <div className="container-fluid page-layout dashboard-table-view">
                    <div className="row">
                      <div className="col-md-10 m-auto">
                        {(isLoading || (delegations && delegations.length > 0)) && (
                          <h1>Your delegations</h1>
                        )}

                        <NetworkWarning
                          incorrectNetwork={!isForeignNetwork}
                          networkName={config.foreignNetworkName}
                        />

                        {isLoading && <Loader className="fixed" />}

                        {!isLoading && (
                          <div>
                            {delegations &&
                              delegations.length > 0 && (
                                <div className="table-container">
                                  <table className="table table-responsive table-striped table-hover">
                                    <thead>
                                      <tr>
                                        {currentUser.authenticated && <th className="td-actions" />}
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
                                        <tr key={d.adminId}>
                                          {currentUser.authenticated && (
                                            <td className="td-actions">
                                              {/* When donated to a dac, allow delegation
                                        to campaigns and milestones */}
                                              {(d.delegateId > 0 ||
                                                d.ownerTypeId === currentUser.address) &&
                                                isForeignNetwork &&
                                                d.amountRemaining > 0 && (
                                                  <DelegateButton
                                                    types={campaigns.concat(
                                                      milestones.filter(
                                                        m => m.symbol === d.token.symbol,
                                                      ),
                                                    )}
                                                    donation={d}
                                                    balance={balance}
                                                    symbol={(d.token && d.token.symbol) || 'ETH'}
                                                  />
                                                )}

                                              {/* When donated to a campaign, only allow delegation
                                        to milestones of that campaign */}
                                              {d.ownerType === 'campaign' &&
                                                isForeignNetwork &&
                                                d.amountRemaining > 0 && (
                                                  <DelegateButton
                                                    types={milestones.filter(
                                                      m => m.campaignId === d.ownerTypeId,
                                                    )}
                                                    donation={d}
                                                    balance={balance}
                                                    milestoneOnly
                                                  />
                                                )}
                                            </td>
                                          )}

                                          <td className="td-date">
                                            {moment(d.createdAt).format('MM/DD/YYYY')}
                                          </td>

                                          <td className="td-donated-to">
                                            <Link to={d.donatedTo.url}>
                                              {d.donatedTo.type} <em>{d.donatedTo.name}</em>
                                            </Link>
                                          </td>
                                          <td className="td-donations-amount">
                                            {d.isPending && (
                                              <span>
                                                <i className="fa fa-circle-o-notch fa-spin" />
                                                &nbsp;
                                              </span>
                                            )}
                                            {convertEthHelper(d.amountRemaining)}{' '}
                                            {(d.token && d.token.symbol) || 'ETH'}
                                          </td>
                                          <td className="td-user">
                                            <Link to={`profile/${d.giver.address}`}>
                                              <Avatar
                                                size={30}
                                                src={getUserAvatar(d.giver)}
                                                round
                                              />
                                              {getUserName(d.giver)}
                                            </Link>
                                          </td>
                                          <td className="td-tx-address">{d.giverAddress}</td>
                                          <td className="td-status">{d.statusDescription}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                            {delegations &&
                              totalResults > itemsPerPage && (
                                <center>
                                  <Pagination
                                    activePage={skipPages + 1}
                                    itemsCountPerPage={itemsPerPage}
                                    totalItemsCount={totalResults}
                                    pageRangeDisplayed={visiblePages}
                                    onChange={handlePageChanged}
                                  />
                                </center>
                              )}
                            {delegations &&
                              delegations.length === 0 && (
                                <div>
                                  <center>
                                    <h3>There&apos;s nothing to delegate (yet)!</h3>
                                    <img
                                      className="empty-state-img"
                                      src={`${process.env.PUBLIC_URL}/img/delegation.svg`}
                                      width="200px"
                                      height="200px"
                                      alt="no-delegations-icon"
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
              )}
            </DelegationConsumer>
          </DelegationProvider>
        )}
      </UserConsumer>
    )}
  </Web3Consumer>
);

Delegations.propTypes = {
  balance: PropTypes.objectOf(utils.BN).isRequired,
};

export default Delegations;
