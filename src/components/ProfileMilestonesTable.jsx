import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { convertEthHelper, getReadableStatus, getTruncatedText } from '../lib/helpers';
import { Milestone } from '../models';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';

const ProfileMilestonesTable = ({ userAddress }) => {
  const [isLoading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [total, setTotal] = useState(0);
  const [skipPages, setSkipPages] = useState(0);
  const itemsPerPage = 25;
  const isMounted = useRef(false);

  const reviewDue = updatedAt =>
    moment()
      .subtract(3, 'd')
      .isAfter(moment(updatedAt));

  const loadUserMilestones = () => {
    if (isMounted.current === false) return;

    feathersClient
      .service('milestones')
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
            { recipientAddress: userAddress },
          ],
        },
      })
      .then(resp => {
        if (isMounted.current) {
          setMilestones(resp.data.map(m => new Milestone(m)));
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
    loadUserMilestones();
  }, [userAddress, skipPages]);

  const handlePageChanged = newPage => {
    setSkipPages(newPage - 1);
  };

  return (
    <Fragment>
      {(isLoading || (milestones && milestones.length > 0)) && <h4>Milestones</h4>}
      <div>
        {isLoading && <Loader className="small relative" />}
        {!isLoading && milestones && milestones.length > 0 && (
          <div className="table-container">
            <table className="table table-responsive table-striped table-hover">
              <thead>
                <tr>
                  <th className="td-created-at">Created</th>
                  <th className="td-name">Name</th>
                  <th className="td-status">Status</th>
                  <th className="td-donations-number">Requested</th>
                  <th className="td-donations-number">Donations</th>
                  <th className="td-donations-amount">Amount</th>
                  <th className="td-reviewer">Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map(m => (
                  <tr key={m._id} className={m.status === 'Pending' ? 'pending' : ''}>
                    <td className="td-created-at">
                      {m.createdAt && <span>{moment.utc(m.createdAt).format('Do MMM YYYY')}</span>}
                    </td>
                    <td className="td-name">
                      <strong>
                        <Link to={`/campaigns/${m.campaign._id}/milestones/${m._id}`}>
                          MILESTONE <em>{getTruncatedText(m.title, 35)}</em>
                        </Link>
                      </strong>
                      <br />
                      <i className="fa fa-arrow-right" />
                      <Link className="secondary-link" to={`/campaigns/${m.campaign._id}`}>
                        CAMPAIGN <em>{getTruncatedText(m.campaign.title, 40)}</em>
                      </Link>
                      <div>
                        {m.ownerAddress === userAddress && (
                          <span className="badge badge-success">
                            <i className="fa fa-flag-o" />
                            Owner
                          </span>
                        )}
                        {m.reviewerAddress === userAddress && (
                          <span className="badge badge-info">
                            <i className="fa fa-eye" />
                            Reviewer
                          </span>
                        )}
                        {m.recipientAddress === userAddress && (
                          <span className="badge badge-warning">
                            <i className="fa fa-diamond" />
                            Recipient
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td-status">
                      {(m.status === 'Pending' ||
                        (Object.keys(m).includes('mined') && !m.mined)) && (
                        <span>
                          <i className="fa fa-circle-o-notch fa-spin" />
                          &nbsp;
                        </span>
                      )}
                      {m.status === 'NeedsReview' && reviewDue(m.updatedAt) && (
                        <span>
                          <i className="fa fa-exclamation-triangle" />
                          &nbsp;
                        </span>
                      )}
                      {getReadableStatus(m.status)}
                    </td>
                    <td className="td-donations-number">
                      {m.isCapped
                        ? `${convertEthHelper(m.maxAmount, m.token && m.token.decimals)} ${
                            m.token.symbol
                          }`
                        : 'Uncapped'}
                    </td>
                    <td className="td-donations-number">{m.totalDonations}</td>
                    <td className="td-donations-amount">
                      {m.totalDonated.map(td => (
                        <div key={td.symbol}>
                          {convertEthHelper(td.amount, td.decimals)} {td.symbol}
                        </div>
                      ))}
                    </td>
                    <td className="td-reviewer">
                      {m.reviewer && m.reviewerAddress && (
                        <Link to={`/profile/${m.reviewerAddress}`}>
                          {m.reviewer.name || 'Anomynous user'}
                        </Link>
                      )}
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

ProfileMilestonesTable.propTypes = {
  userAddress: PropTypes.string.isRequired,
};

export default ProfileMilestonesTable;
