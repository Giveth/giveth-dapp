import React, { Fragment, useEffect, useRef, useState } from 'react';
import { paramsForServer } from 'feathers-hooks-common';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import moment from 'moment';
import { convertEthHelper } from '../lib/helpers';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import { Donation } from '../models';
import config from '../configuration';

const ProfileDacsTable = ({ userAddress }) => {
  const [isLoading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [skipPages, setSkipPages] = useState(0);
  const itemsPerPage = 25;
  const isMounted = useRef(false);

  const loadUserDacs = () => {
    if (isMounted.current === false) return;
    feathersClient
      .service('donations')
      .find(
        paramsForServer({
          schema: 'includeTypeDetails',
          query: {
            giverAddress: userAddress,
            homeTxHash: { $exists: true },
            // no parentDonations is the 1st of 2 Transfer events emitted when a new donation occurs
            // we want to exclude those
            parentDonations: { $ne: [] },
            canceledPledgeId: null,
            lessThanCutoff: { $ne: true },
            $limit: itemsPerPage,
            $skip: skipPages * itemsPerPage,
          },
        }),
      )
      .then(resp => {
        if (isMounted.current) {
          setDonations(resp.data.map(m => new Donation(m)));
          setTotal(resp.total);
          setLoading(false);
        }
      });
  };

  const cleanUp = () => {
    isMounted.current = false;
  };

  useEffect(() => {
    isMounted.current = true;
    return cleanUp;
  }, []);

  useEffect(() => {
    setLoading(true);
    loadUserDacs();
  }, [userAddress, skipPages]);

  const handlePageChanged = newPage => {
    setSkipPages(newPage - 1);
  };

  const { homeEtherscan: homeEtherScanUrl } = config;

  return (
    <Fragment>
      {(isLoading || (donations && donations.length > 0)) && <h4>Donations</h4>}
      <div>
        {isLoading && <Loader className="small relative" />}
        {!isLoading && (
          <div className="table-container">
            {donations && donations.length > 0 && (
              <div>
                <table className="table table-responsive table-striped table-hover">
                  <thead>
                    <tr>
                      <th className="td-date">Date</th>
                      <th className="td-donated-to">Donated to</th>
                      <th className="td-donations-amount">Amount</th>
                      <th className="td-transaction-status">Status</th>
                      <th className="td-tx-address">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => (
                      <tr key={d.id} className={d.isPending ? 'pending' : ''}>
                        <td className="td-date">{moment(d.createdAt).format('MM/DD/YYYY')}</td>

                        <td className="td-donated-to">
                          {d.intendedProjectId > 0 && (
                            <span className="badge badge-info">
                              <i className="fa fa-random" />
                              &nbsp;Delegated
                            </span>
                          )}
                          <Link to={d.donatedTo.url}>
                            {d.donatedTo.type} <em>{d.donatedTo.name}</em>
                          </Link>
                        </td>
                        <td className="td-donations-amount">
                          {convertEthHelper(d.amount, d.token.decimals)} {d.token.symbol}
                        </td>

                        <td className="td-transaction-status">
                          {d.isPending && (
                            <span>
                              <i className="fa fa-circle-o-notch fa-spin" />
                              &nbsp;
                            </span>
                          )}
                          {!d.isPending && d.amountRemaining > 0 && <span>{d.status}</span>}
                          {!d.isPending &&
                            d.amountRemaining === '0' &&
                            (d.delegateId ? 'Delegated' : Donation.COMMITTED)}
                        </td>

                        {homeEtherScanUrl ? (
                          <td className="td-tx-address">
                            <a
                              href={`${homeEtherScanUrl}address/${d.giverAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {d.giverAddress}
                            </a>
                          </td>
                        ) : (
                          <td className="td-tx-address">{d.giverAddress}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {total > itemsPerPage && (
                  <div className="text-center">
                    <Pagination
                      activePage={skipPages + 1}
                      itemsCountPerPage={itemsPerPage}
                      totalItemsCount={total}
                      pageRangeDisplayed={10}
                      onChange={handlePageChanged}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Fragment>
  );
};

ProfileDacsTable.propTypes = {
  userAddress: PropTypes.string.isRequired,
};

export default ProfileDacsTable;
