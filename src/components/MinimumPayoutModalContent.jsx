import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import Lottie from 'lottie-react';
import AlertAnimation from '../assets/alert-notification.json';

const MinimumPayoutModalContent = ({ closeModal, minimumPayoutUsdValue, type }) => {
  let title = '';
  let description = '';
  if (type === 'Creat/Edit') {
    title = `Minimum amount of $${minimumPayoutUsdValue} required`;
    description = `Minimum amount of $${minimumPayoutUsdValue} is required before you can continue. This is a
        temporary limitation due to Ethereum network issues.`;
  } else if (type === 'Archive') {
    title = `Minimum donation balance of $${minimumPayoutUsdValue} required`;
    description = `A minimum donation balance of $${minimumPayoutUsdValue} is required
        before you can archive this milestone. This is a temporary
        limitation due to Ethereum Mainnet issues.`;
  } else if (type === 'MarkComplete') {
    title = `Minimum donation balance of $${minimumPayoutUsdValue} required`;
    description = `A minimum donation balance of $${minimumPayoutUsdValue} is required
        before you can mark this milestone complete. This is a temporary
        limitation due to Ethereum Mainnet issues.`;
  } else if (type === 'Withdraw') {
    title = `Minimum donation balance of $${minimumPayoutUsdValue} required`;
    description = `A minimum donation balance of
        $${minimumPayoutUsdValue} is required before you can collect or disburse the funds.
        This is a temporary limitation due to Ethereum Mainnet issues.`;
  }

  return (
    <Fragment>
      <Lottie
        className="m-auto"
        animationData={AlertAnimation}
        loop={false}
        style={{ width: '300px' }}
      />
      <h2 className="text-center font-weight-bold" style={{ color: '#2C0B3F' }}>
        {title}
      </h2>
      <p
        className="text-center pb-3"
        style={{ color: '#6B7087', fontSize: '18px', fontFamily: 'Lato' }}
      >
        {description}
      </p>
      <div className="text-center pb-3">
        <Button onClick={closeModal} className="px-5">
          <span className="px-3">OK, got it!</span>
        </Button>
      </div>
    </Fragment>
  );
};

MinimumPayoutModalContent.propTypes = {
  closeModal: PropTypes.func.isRequired,
  minimumPayoutUsdValue: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['Creat/Edit', 'MarkComplete', 'Archive', 'Withdraw']).isRequired,
};

export default React.memo(MinimumPayoutModalContent);
