import Avatar from 'react-avatar';
import React from 'react';
import PropTypes from 'prop-types';
import { getUserAvatar, getUserName } from '../lib/helpers';
import config from '../configuration';
import { User } from '../models';

const { homeEtherscan } = config;

const ProfileUserInfo = ({ user }) => {
  return (
    <div className="text-center">
      <Avatar size={100} src={getUserAvatar(user)} round />
      <h1>{getUserName(user)}</h1>
      {homeEtherscan ? (
        <p>
          <a
            href={`${homeEtherscan}address/${user.address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {user.address}
          </a>
        </p>
      ) : (
        <p>{user.address}</p>
      )}
      <p>{user.email}</p>
      <p>{user.linkedin}</p>
    </div>
  );
};

ProfileUserInfo.propTypes = {
  user: PropTypes.instanceOf(User),
};

ProfileUserInfo.defaultProps = {
  user: {},
};

export default ProfileUserInfo;
