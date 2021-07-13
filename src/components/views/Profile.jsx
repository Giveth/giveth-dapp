/* eslint-disable prefer-destructuring */

import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Lottie from 'lottie-react';
import { feathersClient } from '../../lib/feathersClient';
import GoBackButton from '../GoBackButton';
import { history } from '../../lib/helpers';

import ProfileTracesTable from '../ProfileTracesTable';
import ProfileCampaignsTable from '../ProfileCampaignsTable';
import ProfileCommunitiesTable from '../ProfileCommunitiesTable';
import ProfileDonationsTable from '../ProfileDonationsTable';
import ProfileUserInfo from '../ProfileUserInfo';
import ProfileUpdatePermission from '../ProfileUpdatePermission';
import { User } from '../../models';
import SearchAnimation from '../../assets/search-file.json';

/**
 * The user profile view mapped to /profile/{userAddress}
 */
const Profile = props => {
  const { userAddress } = props.match.params;
  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(true);
  const [user, setUser] = useState({});

  const isMounted = useRef(true);

  useEffect(() => {
    feathersClient
      .service('users')
      .find({ query: { address: userAddress, $limit: 1 } })
      .then(resp => {
        const _user = resp.data[0];
        if (isMounted.current) {
          setUser(new User(_user));
          setLoading(false);
          setHasError(false);
        }
      })
      .catch(() => {
        if (isMounted.current) {
          setLoading(false);
          setHasError(true);
        }
      });

    return () => {
      isMounted.current = false;
    };
  }, []);

  const updateUser = newUser => {
    if (isMounted.current) {
      setUser(newUser);
    }
  };

  const renderUserStats = () => (
    <Fragment>
      {!hasError && (
        <div>
          <GoBackButton history={history} goPreviousPage />

          <ProfileUserInfo user={user} />

          <ProfileUpdatePermission user={user} updateUser={updateUser} />
        </div>
      )}

      <ProfileTracesTable userAddress={userAddress} />

      <ProfileCampaignsTable userAddress={userAddress} />

      <ProfileCommunitiesTable userAddress={userAddress} />

      <ProfileDonationsTable userAddress={userAddress} />
    </Fragment>
  );

  const renderUserNotFound = () => (
    <Fragment>
      <h3 style={{ color: '#2C0B3F' }}>No results found</h3>
      <p
        style={{
          fontSize: '18px',
          fontFamily: 'Lato',
          color: '#6B7087',
        }}
      >
        We couldn’t find any user for your search or it doesn’t exist.
      </p>
    </Fragment>
  );

  return (
    <div id="profile-view">
      <div className="container-fluid page-layout dashboard-table-view">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div className="text-center">
              {(isLoading || (!isLoading && !user.address)) && (
                <Lottie
                  animationData={SearchAnimation}
                  className="m-auto"
                  loop={false}
                  style={{ width: '250px' }}
                  autoplay={isLoading}
                />
              )}
              {!isLoading && (user.address ? renderUserStats() : renderUserNotFound())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Profile.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      userAddress: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default Profile;
