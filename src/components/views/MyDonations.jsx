import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Pagination from 'react-js-pagination';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import config from 'configuration';

import { Helmet } from 'react-helmet';
import Loader from '../Loader';
import { convertEthHelper } from '../../lib/helpers';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import AuthenticationWarning from '../AuthenticationWarning';
import DonationService from '../../services/DonationService';
import ErrorPopup from '../ErrorPopup';
import { authenticateUser, checkBalance } from '../../lib/middleware';
import DonationBlockchainService from '../../services/DonationBlockchainService';
import confirmationDialog from '../../lib/confirmationDialog';

const etherScanUrl = config.etherscan;
const itemsPerPage = 20;
const visiblePages = 10;

/**
 * The my donations view
 */
const MyDonations = () => {
  const [skipPages, setSkipPages] = useState();
  const [totalResults, setTotalResults] = useState();
  const [donations, setDonations] = useState();
  const [isLoading, setIsLoading] = useState(true);

  const {
    state: { isForeignNetwork, balance, web3 },
  } = useContext(Web3Context);

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const userAddress = currentUser.address;

  const getUserDonations = () => {
    DonationService.getUserDonations({
      currentUser,
      itemsPerPage,
      skipPages,
      subscribe: true,
      onResult: resp => {
        setTotalResults(resp.total);
        setIsLoading(false);
        setDonations(resp.data);
      },
      onError: err => {
        ErrorPopup('Something went wrong on getting user donations!', err);
      },
    });
  };

  const handlePageChanged = newPage => {
    // Skip rerendering for same page
    if (newPage - 1 !== skipPages) {
      setSkipPages(newPage - 1);
    }
  };

  const capitalizeFirstLetter = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const reject = donation => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) {
        return;
      }
      checkBalance(balance)
        .then(() =>
          React.swal({
            title: 'Reject your donation?',
            text: `Your donation will not go to this ${capitalizeFirstLetter(
              donation.intendedProjectType,
            )}. You will still be in control of you funds and the Community can still delegate you donation.`,
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Yes, reject'],
          }).then(isConfirmed => {
            if (isConfirmed) {
              // Inform user after the transaction is created
              const afterCreate = txLink => {
                React.toast.success(
                  <p>
                    The refusal of the delegation is pending...
                    <br />
                    <a href={txLink} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              };

              // Inform user after the refusal transaction is mined
              const afterMined = txLink => {
                React.toast.success(
                  <p>
                    Your donation delegation has been rejected.
                    <br />
                    <a href={txLink} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              };

              // Reject the delegation of the donation
              DonationBlockchainService.reject(donation, userAddress, afterCreate, afterMined);
            }
          }),
        )
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        });
    });
  };

  const commit = donation => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) {
        return;
      }
      checkBalance(balance)
        .then(() =>
          React.swal({
            title: 'Commit your donation?',
            text:
              'Your donation will go to this Trace. After committing you can no longer take back your money.',
            icon: 'warning',
            buttons: ['Cancel', 'Yes, commit'],
          }).then(isConfirmed => {
            if (isConfirmed) {
              // Inform user after the transaction is created
              const afterCreate = txLink => {
                React.toast.success(
                  <p>
                    The commitment of the donation is pending...
                    <br />
                    <a href={txLink} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              };

              // Inform user after the commit transaction is mined
              const afterMined = txLink => {
                React.toast.success(
                  <p>
                    Your donation has been committed!
                    <br />
                    <a href={txLink} target="_blank" rel="noopener noreferrer">
                      View transaction
                    </a>
                  </p>,
                );
              };

              // Commit the donation's delegation
              DonationBlockchainService.commit(
                donation,
                userAddress,
                afterCreate,
                afterMined,
                err => ErrorPopup('Something went wrong.', err),
              );
            }
          }),
        )
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        });
    });
  };

  const refund = donation => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) {
        return;
      }
      checkBalance(balance).then(() => {
        const confirmRefund = () => {
          const afterCreate = txLink => {
            React.toast.success(
              <p>
                The refund is pending...
                <br />
                <a href={txLink} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          };

          // Inform user after the refund transaction is mined
          const afterMined = txLink => {
            React.toast.success(
              <p>
                Your donation has been refunded!
                <br />
                <a href={txLink} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          };

          // Refund the donation
          DonationBlockchainService.refund(donation, userAddress, afterCreate, afterMined);
        };
        confirmationDialog('refund', donation.donatedTo.name, confirmRefund);
      });
    });
  };

  const cleanup = () => DonationService.unsubscribe();

  useEffect(() => {
    if (userAddress) {
      setIsLoading(true);
      getUserDonations();
    }
    return cleanup;
  }, [skipPages]);

  useEffect(() => {
    if (userAddress) {
      setSkipPages(0);
    }
    return cleanup;
  }, [userAddress]);

  return (
    <Fragment>
      <Helmet>
        <title>My Donations</title>
      </Helmet>
      <div className="container-fluid page-layout dashboard-table-view">
        <div className="row">
          <div className="col-md-10 m-auto">
            {(isLoading || (donations && donations.length > 0)) && <h1>My Donations</h1>}

            <ViewNetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />

            <AuthenticationWarning />

            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <div className="table-container dashboard-table-view">
                {donations && donations.length > 0 && (
                  <table className="table table-responsive table-striped table-hover">
                    <thead>
                      <tr>
                        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                        <th className="td-action" />
                        <th className="td-transaction-status">Status</th>
                        <th className="td-date">Date</th>
                        <th className="td-donated-to">Donated to</th>
                        <th className="td-donations-amount">Amount</th>
                        <th className="td-tx-address">Address</th>
                        <th className="td-confirmations">
                          {donations.some(d => d.isPending) && 'Confirmations'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map(d => (
                        <tr key={d.id} name={d.id} className={d.isPending ? 'pending' : ''}>
                          <td className="td-actions">
                            {d.canRefund(currentUser, isForeignNetwork) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => refund(d)}
                              >
                                Refund
                              </button>
                            )}
                            {d.canApproveReject(currentUser, isForeignNetwork) && (
                              <div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => commit(d)}
                                >
                                  Commit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => reject(d)}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="td-transaction-status">
                            {d.isPending && (
                              <span>
                                <i className="fa fa-circle-o-notch fa-spin" />
                                &nbsp;
                              </span>
                            )}
                            {d.statusDescription}
                          </td>

                          <td className="td-date">{moment(d.createdAt).format('MM/DD/YYYY')}</td>

                          <td className="td-donated-to">
                            {d.intendedProjectId > 0 && (
                              <Fragment>
                                <span className="badge badge-info">
                                  <i className="fa fa-random" />
                                  &nbsp;Delegated
                                </span>
                                <span>&nbsp;</span>
                              </Fragment>
                            )}
                            <Link to={d.donatedTo.url}>
                              {d.donatedTo.type} <em>{d.donatedTo.name}</em>
                            </Link>
                          </td>
                          <td className="td-donations-amount">
                            {convertEthHelper(d.amountRemaining, d.token.decimals)}{' '}
                            {d.token && d.token.symbol}
                          </td>

                          {etherScanUrl && (
                            <td className="td-tx-address">
                              <a
                                href={`${etherScanUrl}address/${d.giverAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {d.giverAddress}
                              </a>
                            </td>
                          )}
                          {!etherScanUrl && <td className="td-tx-address">{d.giverAddress}</td>}

                          <td className="td-confirmations">
                            {donations.some(dn => dn.isPending) &&
                              `${d.confirmations}/${d.requiredConfirmations}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {donations && totalResults > itemsPerPage && (
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

                {donations && donations.length === 0 && (
                  <div>
                    <div className="text-center">
                      <h3>You didn&apos;t make any donations yet!</h3>
                      <img
                        className="empty-state-img"
                        src={`${process.env.PUBLIC_URL}/img/donation.svg`}
                        width="200px"
                        height="200px"
                        alt="no-donations-icon"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default MyDonations;
