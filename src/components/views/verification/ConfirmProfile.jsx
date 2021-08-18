import React, { useContext } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import walletIcon from '../../../assets/wallet.svg';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import User from '../../../models/User';
import { Context as UserContext } from '../../../contextProviders/UserProvider';

const ConfirmProfile = ({ handleNextStep, owner, reportIssue, formIsValid }) => {
  const {
    state: { web3 },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const { email, url, location, avatar, name, address: userAddress } = owner;

  const submitProfile = () => {
    if (!name) return;
    if (currentUser.giverId) handleNextStep();
    else {
      const user = new User(currentUser);
      user.name = name;
      user.avatar = avatar || '';
      user.newAvatar = avatar || '';
      user.email = email || '';
      user.linkedin = url || '';

      user.save(true, web3, handleNextStep);
    }
  };

  return (
    <div className="p-5">
      <h2>Please confirm your identity</h2>
      <div className="d-flex align-items-start flex-wrap mx-auto justify-content-center">
        {avatar && <img className="mr-3 mt-1 rounded-circle" width={70} src={avatar} alt={name} />}
        <div className="text-left">
          <div className="d-flex align-items-center flex-wrap">
            <div className="mr-5 mt-3">
              <h6>{name}</h6>
              <div>{email}</div>
            </div>
            <div className="mt-3">
              <div className="d-flex">
                <img className="mr-2" src={walletIcon} alt="wallet address" />
                <h6>Wallet Address</h6>
              </div>
              <div className="text-break">{userAddress}</div>
            </div>
          </div>
          <div className="d-flex my-4">
            <div className="mr-5">
              <div className="link-small">Name</div>
              <div className="link-small">Location</div>
              <div className="link-small">Website or URL</div>
            </div>
            <div>
              <div className="profile-value">{name}</div>
              <div className="profile-value">{location}</div>
              <div className="profile-value">{url}</div>
            </div>
          </div>
          <Button disabled={!formIsValid} ghost onClick={submitProfile}>
            CONFIRM YOUR PROFILE
          </Button>
          <Button onClick={reportIssue} type="text">
            Report an Issue
          </Button>
        </div>
      </div>
    </div>
  );
};

ConfirmProfile.propTypes = {
  handleNextStep: PropTypes.func.isRequired,
  owner: PropTypes.shape().isRequired,
  reportIssue: PropTypes.func.isRequired,
  formIsValid: PropTypes.bool.isRequired,
};

export default ConfirmProfile;
