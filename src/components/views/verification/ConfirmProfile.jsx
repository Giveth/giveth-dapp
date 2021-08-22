import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import walletIcon from '../../../assets/wallet.svg';

const ConfirmProfile = ({ handleNextStep, owner, reportIssue, formIsValid, isSaving }) => {
  const { email, url, location, avatar, name, address: userAddress } = owner;

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
          <Button loading={isSaving} disabled={!formIsValid} ghost onClick={handleNextStep}>
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
  isSaving: PropTypes.bool.isRequired,
};

export default ConfirmProfile;
