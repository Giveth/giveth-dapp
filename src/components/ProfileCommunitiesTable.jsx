import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { convertEthHelper, getTruncatedText } from '../lib/helpers';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import { Community } from '../models';

const ProfileCommunitiesTable = ({ userAddress }) => {
  const [isLoading, setLoading] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [total, setTotal] = useState(0);
  const [skipPages, setSkipPages] = useState(0);
  const itemsPerPage = 25;
  const isMounted = useRef(false);

  const loadUserCommunities = () => {
    if (isMounted.current === false) return;
    feathersClient
      .service('communities')
      .find({
        query: {
          ownerAddress: userAddress,
          $sort: {
            createdAt: -1,
          },
          $limit: itemsPerPage,
          $skip: skipPages * itemsPerPage,
        },
      })
      .then(resp => {
        if (isMounted.current) {
          setCommunities(resp.data.map(m => new Community(m)));
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
    loadUserCommunities();
  }, [userAddress, skipPages]);

  const handlePageChanged = newPage => {
    setSkipPages(newPage - 1);
  };

  return (
    <Fragment>
      {(isLoading || (communities && communities.length > 0)) && <h4>Communities</h4>}
      <div>
        {isLoading && <Loader className="small relative" />}
        {!isLoading && communities && communities.length > 0 && (
          <div className="table-container">
            <table className="table table-responsive table-striped table-hover">
              <thead>
                <tr>
                  <th className="td-name">Name</th>
                  <th className="td-donations-number">Donations</th>
                  <th className="td-donations-amount">Amount</th>
                  <th className="td-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {communities.map(d => (
                  <tr key={d._id} className={d.status === Community.PENDING ? 'pending' : ''}>
                    <td className="td-name">
                      <Link to={`/communities/${d._id}`}>{getTruncatedText(d.title, 45)}</Link>
                      <div>
                        {d.ownerAddress === userAddress && (
                          <span className="badge badge-success">
                            <i className="fa fa-flag-o" />
                            Owner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td-donations-number">{d.totalDonations || 0}</td>
                    <td className="td-donations-amount">
                      {d.totalDonated.map(td => (
                        <div key={td.symbol}>
                          {convertEthHelper(td.amount, td.decimals)} {td.symbol}
                        </div>
                      ))}
                    </td>
                    <td className="td-status">
                      {d.status === Community.PENDING && (
                        <span>
                          <i className="fa fa-circle-o-notch fa-spin" />
                          &nbsp;
                        </span>
                      )}
                      {d.status}
                    </td>
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
    </Fragment>
  );
};

ProfileCommunitiesTable.propTypes = {
  userAddress: PropTypes.string.isRequired,
};

export default ProfileCommunitiesTable;
