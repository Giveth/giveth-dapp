import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import moment from 'moment';
import Pagination from 'react-js-pagination';
import BigNumber from 'bignumber.js';

import User from 'models/User';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Consumer as Web3Consumer } from 'contextProviders/Web3Provider';
import config from 'configuration';

import Loader from '../Loader';
import DelegateButton from '../DelegateButton';
import { getUserName, getUserAvatar, convertEthHelper } from '../../lib/helpers';

import DelegationProvider, {
  Consumer as DelegationConsumer,
} from '../../contextProviders/DelegationProvider';
import Donation from '../../models/Donation';
import AuthenticationWarning from '../AuthenticationWarning';

/**
 * The my delegations view
 */
const Delegations = ({ balance, currentUser }) => (
  <Web3Consumer>
    {({ state: { isForeignNetwork } }) => (
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
              <div className="container-fluid page-layout">
                <div className="row">
                  <div className="col-md-10 m-auto">
                    {(isLoading || (delegations && delegations.length > 0)) && (
                      <h1>Your delegations</h1>
                    )}

                    <ViewNetworkWarning
                      incorrectNetwork={!isForeignNetwork}
                      networkName={config.foreignNetworkName}
                    />

                    <AuthenticationWarning currentUser={currentUser} />

                    {isLoading && <Loader className="fixed" />}

                    {!isLoading && (
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
                                  <tr key={d._id}>
                                    <td className="td-actions">
                                      {/* When donated to a dac, allow delegation
                                  to campaigns and milestones */}
                                      {(d.delegateId > 0 ||
                                        d.ownerTypeId === currentUser.address) &&
                                        isForeignNetwork &&
                                        d.status === Donation.WAITING &&
                                        d.amountRemaining > 0 && (
                                          <DelegateButton
                                            types={campaigns.concat(milestones)}
                                            donation={d}
                                            balance={balance}
                                            currentUser={currentUser}
                                            symbol={
                                              (d.token && d.token.symbol) || config.nativeTokenName
                                            }
                                          />
                                        )}

                                      {/* When donated to a campaign, only allow delegation
                                  to milestones of that campaign */}
                                      {d.ownerType === 'campaign' &&
                                        isForeignNetwork &&
                                        d.status === Donation.COMMITTED &&
                                        d.amountRemaining > 0 && (
                                          <DelegateButton
                                            types={milestones.filter(
                                              m =>
                                                m.campaignId === d.ownerTypeId &&
                                                (!m.acceptsSingleToken ||
                                                  m.token.symbol === d.token.symbol),
                                            )}
                                            donation={d}
                                            balance={balance}
                                            currentUser={currentUser}
                                            milestoneOnly
                                          />
                                        )}
                                    </td>

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
                                      {convertEthHelper(
                                        d.amountRemaining,
                                        d.token && d.token.decimals,
                                      )}{' '}
                                      {(d.token && d.token.symbol) || config.nativeTokenName}
                                    </td>
                                    <td className="td-user">
                                      <Link to={`profile/${d.giver.address}`}>
                                        <Avatar size={30} src={getUserAvatar(d.giver)} round />
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

                        {delegations && totalResults > itemsPerPage && (
                          <div className="text-center">
                            <Pagination
                              activePage={skipPages + 1}
                              itemsCountPerPage={itemsPerPage}
                              totalItemsCount={totalResults}
                              pageRangeDisplayed={visiblePages}
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DelegationConsumer>
      </DelegationProvider>
    )}
  </Web3Consumer>
);

Delegations.propTypes = {
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
};

export default Delegations;
