import Avatar from 'react-avatar';
import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { getUserAvatar, getUserName } from '../lib/helpers';
import config from '../configuration';
import { User } from '../models';

const { homeEtherscan } = config;

const UserRoleTag = ({ user }) => {
  return (
    <div>
      {user.isAdmin && (
        <span className="badge badge-danger" data-tip="React-tooltip" data-for="admin">
          Admin
          <ReactTooltip id="admin" place="top" type="dark" effect="solid">
            Can assign role to users
          </ReactTooltip>
        </span>
      )}
      {user.isDelegator && (
        <span className="badge badge-primary" data-tip="React-tooltip" data-for="delegator">
          Community Owner
          <ReactTooltip id="delegator" place="top" type="dark" effect="solid">
            Can define new Decentralized Altruistic Community
          </ReactTooltip>
        </span>
      )}
      {user.isProjectOwner && (
        <span className="badge badge-success" data-tip="React-tooltip" data-for="projectOwner">
          Campaign Owner
          <ReactTooltip id="projectOwner" place="top" type="dark" effect="solid">
            Can define new Campaign
          </ReactTooltip>
        </span>
      )}
      {user.isReviewer && (
        <span className="badge badge-info" data-tip="React-tooltip" data-for="reviewer">
          Reviewer
          <ReactTooltip id="reviewer" place="top" type="dark" effect="solid">
            Can be assigned as a project reviewer
          </ReactTooltip>
        </span>
      )}
    </div>
  );
};

UserRoleTag.propTypes = {
  user: PropTypes.instanceOf(User).isRequired,
};

const ProfileUserInfo = ({ user }) => {
  return (
    <div className="text-center">
      <Avatar size={100} src={getUserAvatar(user)} round />
      <h1>{getUserName(user)}</h1>
      <UserRoleTag user={user} />
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
