import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import TxSubmitted from '../assets/transaction-submitted.svg';
import TxSuccessful from '../assets/transaction-successful.svg';
import TxFailed from '../assets/transaction-failed.svg';

const TransactionModalContent = ({ type, txUrl, isDac, msg }) => {
  let title = '';
  let description = '';
  let icon;

  switch (type) {
    case 'donationPending':
      title = 'Transaction Submitted';
      description =
        'It may take few minutes depending on the network. You can close the screen and check the status later in your wallet.';
      icon = TxSubmitted;
      break;
    case 'donationSuccessful':
      title = 'Transaction Successful';
      description = 'Your transaction has been processed. You can close the screen.';
      icon = TxSuccessful;
      break;
    case 'donationFailed':
      title = 'Transaction Failed';
      description = msg;
      icon = TxFailed;
      break;
    case 'delegationPending':
      title = 'Transaction Submitted';
      description = 'The donations have been delegated.';
      if (isDac) {
        description +=
          ' Please note the Giver may have 3 days to reject your delegation before the money gets committed.';
      }
      icon = TxSubmitted;
      break;
    case 'delegationSuccessful':
      title = 'Transaction Successful';
      description = 'The delegation has been confirmed!';
      icon = TxSuccessful;
      break;
    case 'delegationFailed':
      title = 'Transaction Failed';
      description = msg;
      icon = TxFailed;
      break;
    default:
    // TODO: handle wrong type
  }

  return (
    <div className="text-center">
      <img className="my-5" alt="transaction icon" src={icon} />
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
