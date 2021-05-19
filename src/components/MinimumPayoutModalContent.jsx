import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import Lottie from 'lottie-react';
import AlertAnimation from '../assets/alert-notification.json';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';

const MinimumPayoutModalContent = ({ closeModal }) => {
  const {
    state: { minimumPayoutUsdValue },
  } = useContext(WhiteListContext);

  return (
    <Fragment>
      <Lottie
        className="m-auto"
        animationData={AlertAnimation}
        loop={false}
        style={{ width: '300px' }}
      />
      <h2 className="text-center font-weight-bold" style={{ color: '#2C0B3F' }}>
        Minimum amount of ${minimumPayoutUsdValue} required
      </h2>
      <p
        className="text-center pb-3"
        style={{ color: '#6B7087', fontSize: '18px', fontFamily: 'Lato' }}
      >
        Minimum amount of ${minimumPayoutUsdValue} is required before you can continue. This is a
        temporary limitation due to Ethereum network issues.
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
};

export default MinimumPayoutModalContent;
