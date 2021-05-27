import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import Lottie from 'lottie-react';

import TnxFailedAnimation from '../assets/tnx-failed.json';
import TnxSubmittedAnimation from '../assets/tnx-submitted.json';
import TnxSuccessfulAnimation from '../assets/tnx-successful.json';

const TransactionModalContent = ({ type, txUrl, isDac, msg }) => {
  let title = '';
  let description = '';
  let animation;
  let loop = false;

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
      description = 'Your transaction has been processed. You can close the screen.';
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
      if (isDac) {
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

  return (
    <div className="text-center">
      <Lottie
        animationData={animation}
        className="mx-auto my-3 py-5"
        loop={loop}
        style={{ width: '100px' }}
      />
      <h2 className="text-center font-weight-bold" style={{ color: '#2C0B3F' }}>
        {title}
      </h2>
      <p
        className="text-center pb-3"
        style={{ color: '#6B7087', fontSize: '22px', fontFamily: 'Lato' }}
      >
        {description}
      </p>
      {txUrl && (
        <div className="text-center pb-3">
          <Button className="px-5">
            <a href={txUrl} target="_blank" rel="noopener noreferrer">
              View on Etherescan
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
  isDac: PropTypes.bool,
  msg: PropTypes.string,
};

TransactionModalContent.defaultProps = {
  isDac: false,
  msg: 'Something went wrong. Please check transaction details on Etherescan.',
  txUrl: undefined,
};

export default React.memo(TransactionModalContent);
