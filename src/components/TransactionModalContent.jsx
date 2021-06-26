import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import Lottie from 'lottie-react';

import TnxFailedAnimation from '../assets/tnx-failed.json';
import TnxSubmittedAnimation from '../assets/tnx-submitted.json';
import TnxSuccessfulAnimation from '../assets/tnx-successful.json';
import config from '../configuration';
import CommunityService from '../services/CommunityService';
import ErrorHandler from '../lib/ErrorHandler';
import { history } from '../lib/helpers';
import { Context as UserContext } from '../contextProviders/UserProvider';

const DeepPurpleColor = { color: '#2C0B3F' };
const contentTextStyle = {
  color: '#6B7087',
  fontSize: '18px',
  fontFamily: 'Lato',
};

const { defaultCommunityId } = config;

const TransactionModalContent = ({
  type,
  txUrl,
  isCommunity,
  msg,
  customThanksMessage,
  closeModal,
}) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  let title = '';
  let description;
  let animation;
  let loop = false;

  const TnxSuccessfulDescription = () => (
    <Fragment>
      Your transaction has been processed.
      <a href={txUrl} target="_blank" rel="noopener noreferrer">
        {' '}
        View on Etherscan
      </a>
    </Fragment>
  );

  const afterDonate = input => {
    if (input === 'register') {
      history.push('/profile');
    } else {
      CommunityService.getByDelegateId(defaultCommunityId)
        .then(defaultCommunity => {
          history.push(`/community/${defaultCommunity.slug}/donate`);
        })
        .catch(err => {
          ErrorHandler(err, 'Something went wrong on fetching default community!');
        });
    }
    closeModal();
  };

  switch (type) {
    case 'donationPending':
      title = 'Transaction Submitted';
      description =
        'It may take few minutes depending on the network. You can close the screen and check the status later in your wallet.';
      animation = TnxSubmittedAnimation;
      loop = true;
      break;
    case 'donationSuccessful':
      title = 'Transaction Successful';
      description = TnxSuccessfulDescription();
      animation = TnxSuccessfulAnimation;
      break;
    case 'donationFailed':
      title = 'Transaction Failed';
      description = msg;
      animation = TnxFailedAnimation;
      break;
    case 'delegationPending':
      title = 'Transaction Submitted';
      description = 'The donations have been delegated.';
      if (isCommunity) {
        description +=
          ' Please note the Giver may have 3 days to reject your delegation before the money gets committed.';
      }
      animation = TnxSubmittedAnimation;
      loop = true;
      break;
    case 'delegationSuccessful':
      title = 'Transaction Successful';
      description = 'The delegation has been confirmed!';
      animation = TnxSuccessfulAnimation;
      break;
    case 'delegationFailed':
      title = 'Transaction Failed';
      description = msg;
      animation = TnxFailedAnimation;
      break;
    default:
    // TODO: handle wrong type
  }

  const donationSuccessMessage = () => {
    if (currentUser && !currentUser.name) {
      return (
        <div className="mt-4 text-center">
          <div style={{ fontWeight: 500, fontSize: '24px', ...DeepPurpleColor }}>
            Please Register!
          </div>
          <div style={contentTextStyle}>
            Thank you for donating, fill out your Giveth Profile if you want recognition for your
            contribution!
          </div>
          <Button ghost className="px-5 mt-4 mx-1" onClick={closeModal}>
            No Thanks
          </Button>
          <Button className="px-5 mt-4 mx-1" onClick={() => afterDonate('register')}>
            <span className="mx-4">Ok</span>
          </Button>
        </div>
      );
    }
    if (typeof customThanksMessage !== 'undefined') {
      return (
        <div className="mt-4 text-center">
          <div style={{ fontWeight: 500, fontSize: '24px', ...DeepPurpleColor }}>
            {customThanksMessage}
          </div>
          <Button className="px-5 mt-4" onClick={closeModal}>
            OK
          </Button>
        </div>
      );
    }
    if (defaultCommunityId > 0) {
      return (
        <div className="mt-4 text-center">
          <div style={{ fontWeight: 500, fontSize: '24px', ...DeepPurpleColor }}>
            Enjoying Giveth? Consider donating.
          </div>
          <div style={contentTextStyle}>Your help keeps Giveth alive. ❤️</div>
          <Button className="px-5 mt-4" onClick={afterDonate}>
            Donate to Giveth
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="text-center p-4">
      <Lottie
        animationData={animation}
        className="mx-auto my-3 pb-5"
        loop={loop}
        style={{ width: '100px' }}
      />
      <h2 className="text-center font-weight-bold" style={DeepPurpleColor}>
        {title}
      </h2>
      <div className="text-center pb-3" style={contentTextStyle}>
        {description}
      </div>

      {type === 'donationSuccessful' && donationSuccessMessage()}

      {type !== 'donationSuccessful' && txUrl && (
        <div className="text-center py-1">
          <Button className="px-5">
            <a href={txUrl} target="_blank" rel="noopener noreferrer">
              View on Etherscan
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

TransactionModalContent.propTypes = {
  type: PropTypes.oneOf([
    'donationPending',
    'donationSuccessful',
    'donationFailed',
    'delegationPending',
    'delegationSuccessful',
    'delegationFailed',
  ]).isRequired,
  txUrl: PropTypes.string,
  isCommunity: PropTypes.bool,
  msg: PropTypes.string,
  customThanksMessage: PropTypes.string,
  closeModal: PropTypes.func,
};

TransactionModalContent.defaultProps = {
  isCommunity: false,
  msg: 'Something went wrong. Please check transaction details on Etherscan.',
  txUrl: undefined,
  customThanksMessage: undefined,
  closeModal: () => {},
};

export default React.memo(TransactionModalContent);
