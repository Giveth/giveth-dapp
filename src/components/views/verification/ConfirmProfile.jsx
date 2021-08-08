import React, { useContext } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import Pic from '../../../assets/avatar-100.svg';
import walletIcon from '../../../assets/wallet.svg';
import { Context as UserContext } from '../../../contextProviders/UserProvider';

const profile = {
  first: 'Moe',
  last: 'Nick',
  email: 'mrnikkhah@gmail.com',
  image: Pic,
  location: 'World',
  url: 'www.moenick.com',
};

const ConfirmProfile = ({ handleNextStep }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  return (
    <div className="d-flex justify-content-center flex-wrap p-5">
      <h2>Please confirm your identity</h2>
      <div className="d-flex align-items-start flex-wrap">
        <img className="mr-3 mt-1" width={70} src={profile.image} alt={profile.first} />
        <div className="text-left">
          <div className="d-flex align-items-center flex-wrap">
            <div className="mr-5 mt-3">
              <h6>{`${profile.first} ${profile.last}`}</h6>
              <div>{profile.email}</div>
            </div>
            <div className="mt-3">
              <div className="d-flex">
                <img className="mr-2" src={walletIcon} alt="wallet address" />
                <h6>Wallet Address</h6>
              </div>
              <div className="text-break">{currentUser.address}</div>
            </div>
          </div>
          <div className="d-flex my-4">
            <div className="mr-5">
              <div className="link-small">First name</div>
              <div className="link-small">Last name</div>
              <div className="link-small">Location</div>
              <div className="link-small">Website or URL</div>
            </div>
            <div>
              <div className="profile-value">{profile.first}</div>
              <div className="profile-value">{profile.last}</div>
              <div className="profile-value">{profile.location}</div>
              <div className="profile-value">{profile.url}</div>
            </div>
          </div>
          <Button ghost onClick={handleNextStep}>
            CONFIRM & SIGN
          </Button>
          <Button type="text">Report an Issue</Button>
        </div>
      </div>
    </div>
  );
};

ConfirmProfile.propTypes = {
  handleNextStep: PropTypes.func.isRequired,
};

export default ConfirmProfile;
