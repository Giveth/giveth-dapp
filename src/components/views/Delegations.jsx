import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import moment from 'moment';

import Loader from '../Loader';
import DelegateButton from '../../components/DelegateButton';
import { getUserName, getUserAvatar, getTruncatedText, convertEthHelper } from '../../lib/helpers';

import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import DelegationProvider, {
  Consumer as DelegationConsumer,
} from '../../contextProviders/DelegationProvider';

/**
 * The my delegations view
 */
const Delegations = () => (
  <UserConsumer>
    {({ state: { currentUser, wallet } }) => (
      <DelegationProvider currentUser={currentUser} wallet={wallet}>
        <DelegationConsumer>
          {({ state: { isLoading, delegations, campaigns, milestones } }) => (
            <div id="delegations-view">
              <div className="container-fluid page-layout dashboard-table-view">
                <div className="row">
                  <div className="col-md-10 m-auto">
                    {(isLoading || (delegations && delegations.length > 0)) && (
                      <h1>Your delegations</h1>
                    )}

                    {isLoading && <Loader className="fixed" />}

                    {!isLoading && (
                      <div>
                        {delegations &&
                          delegations.length > 0 && (
                            <div className="table-container">
                              <table className="table table-responsive table-striped table-hover">
                                <thead>
                                  <tr>
                                    <th className="td-date">Date</th>
                                    <th className="td-donated-to">Donated to</th>
                                    <th className="td-donations-amount">Amount</th>
                                    <th className="td-user">Received from</th>
                                    <th className="td-tx-address">Address</th>
                                    <th className="td-status">Status</th>
                                    <th className="td-actions" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {delegations.map(d => (
                                    <tr key={d.id}>
                                      <td className="td-date">
                                        {moment(d.createdAt).format('MM/DD/YYYY')}
                                      </td>

                                      {d.delegate > 0 && (
                                        <td className="td-donated-to">
                                          <Link
                                            to={`/dacs/${d._id}`} // eslint-disable-line no-underscore-dangle
                                          >
                                            DAC{' '}
                                            <em>{getTruncatedText(d.delegateEntity.title, 45)}</em>
                                          </Link>
                                        </td>
                                      )}
                                      {!d.delegate &&
                                        d.ownerType !== 'giver' && (
                                          <td className="td-donated-to">
                                            <Link
                                              to={`/${d.ownerType}s/${d.ownerEntity._id}`} // eslint-disable-line no-underscore-dangle
                                            >
                                              {d.ownerType.toUpperCase()}{' '}
                                              <em>{d.ownerEntity.title}</em>
                                            </Link>
                                          </td>
                                        )}
                                      {!d.delegate &&
                                        d.ownerType === 'giver' && (
                                          <td className="td-donated-to">
                                            <Link to={`/profile/${d.ownerEntity.address}`}>
                                              GIVER
                                              <em>
                                                {d.ownerEntity.address === currentUser.address
                                                  ? 'You'
                                                  : d.ownerEntity.name || d.ownerEntity.address}
                                              </em>
                                            </Link>
                                          </td>
                                        )}
                                      <td className="td-donations-amount">
                                        {convertEthHelper(d.amount)} ETH
                                      </td>
                                      <td className="td-user">
                                        <Avatar size={30} src={getUserAvatar(d.giver)} round />
                                        {getUserName(d.giver)}
                                      </td>
                                      <td className="td-tx-address">{d.giverAddress}</td>
                                      <td className="td-status">{d.status}</td>
                                      <td className="td-actions">
                                        {/* When donated to a dac, allow delegation
                                      to campaigns and milestones */}
                                        {(d.delegate > 0 || d.ownerId === currentUser.address) && (
                                          <DelegateButton
                                            types={campaigns.concat(milestones)}
                                            donation={d}
                                            wallet={wallet}
                                          />
                                        )}

                                        {/* TODO enable this, but for lp withdraw to wallet {!d.delegate &&
                                    d.ownerType === 'giver' &&
                                    d.ownerEntity.address === currentUser.address && (
                                      <WithdrawButton currentUser={currentUser} wallet={wallet} />
                                    )} */}

                                        {/* When donated to a campaign, only allow delegation
                                      to milestones of that campaign */}
                                        {d.ownerType === 'campaign' && (
                                          <DelegateButton
                                            types={milestones.filter(
                                              m => m.campaignId === d.ownerId,
                                            )}
                                            donation={d}
                                            milestoneOnly
                                            wallet={wallet}
                                          />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
);

export default Delegations;
