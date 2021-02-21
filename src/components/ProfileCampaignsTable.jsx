import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { convertEthHelper, getTruncatedText } from '../lib/helpers';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import Campaign from '../models/Campaign';

const ProfileCampaignsTable = ({ userAddress }) => {
  const [isLoading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [skipPages, setSkipPages] = useState(0);
  const itemsPerPage = 25;
  const isMounted = useRef(false);

  const loadUserCampaigns = () => {
    if (isMounted.current === false) return;
    feathersClient
      .service('campaigns')
      .find({
        query: {
          $sort: {
            createdAt: -1,
          },
          $limit: itemsPerPage,
          $skip: skipPages * itemsPerPage,
          $or: [
            { ownerAddress: userAddress },
            { reviewerAddress: userAddress },
            { coownerAddress: userAddress },
          ],
        },
      })
      .then(resp => {
        if (isMounted.current) {
          setCampaigns(resp.data.map(m => new Campaign(m)));
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
    loadUserCampaigns();
  }, [userAddress, skipPages]);

  const handlePageChanged = newPage => {
    setSkipPages(newPage - 1);
  };

  return (
    <Fragment>
      {(isLoading || (campaigns && campaigns.length > 0)) && <h4>Campaigns</h4>}
      <div>
        {isLoading && <Loader className="small relative" />}
        {!isLoading && campaigns.length > 0 && (
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
                {campaigns.map(c => (
                  <tr key={c._id} className={c.status === Campaign.PENDING ? 'pending' : ''}>
                    <td className="td-name">
                      <Link to={`/campaigns/${c._id}`}>{getTruncatedText(c.title, 45)}</Link>
                      <div>
                        {c.ownerAddress === userAddress && (
                          <span className="badge badge-success">
                            <i className="fa fa-flag-o" />
                            Owner
                          </span>
                        )}
                        {c.reviewerAddress === userAddress && (
                          <span className="badge badge-info">
                            <i className="fa fa-eye" />
                            Reviewer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td-donations-number">{c.totalDonations || 0}</td>
                    <td className="td-donations-amount">
                      {c.totalDonated.map(td => (
                        <div key={td.symbol}>
                          {convertEthHelper(td.amount, td.decimals)} {td.symbol}
                        </div>
                      ))}
                    </td>
                    <td className="td-status">
                      {(c.status === Campaign.PENDING ||
                        (Object.keys(c).includes('mined') && !c.mined)) && (
                        <span>
                          <i className="fa fa-circle-o-notch fa-spin" />
                          &nbsp;
                        </span>
                      )}
                      {c.status}
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

ProfileCampaignsTable.propTypes = {
  userAddress: PropTypes.string.isRequired,
};

export default ProfileCampaignsTable;
