import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import MinimumPayoutModalContent from './MinimumPayoutModalContent';
import TransactionModalContent from './TransactionModalContent';

const NotificationModal = ({
  show,
  closeModal,
  width,
  minimumPayoutUsdValue,
  type,
  txUrl,
  isDac,
}) => {
  const donationDelegationTypes = [
    'donationPending',
    'donationSuccessful',
    'donationFailed',
    'delegationPending',
    'delegationSuccessful',
    'delegationFailed',
  ];

  return (
    <Fragment>
      {show && (
        <Modal
          visible={show}
          destroyOnClose
          onCancel={() => closeModal(false)}
          width={width}
          footer={null}
          centered
          className="antModalComment pb-0"
        >
          {donationDelegationTypes.includes(type) ? (
            <TransactionModalContent isDac={isDac} txUrl={txUrl} type={type} />
          ) : (
            <MinimumPayoutModalContent
              closeModal={closeModal}
              minimumPayoutUsdValue={minimumPayoutUsdValue}
              type={type}
            />
          )}
        </Modal>
      )}
    </Fragment>
  );
};

NotificationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  width: PropTypes.number,
  minimumPayoutUsdValue: PropTypes.number,
  type: PropTypes.oneOf([
    'Creat/Edit',
    'MarkComplete',
    'Archive',
    'Withdraw',
    'donationPending',
    'donationSuccessful',
    'donationFailed',
    'delegationPending',
    'delegationSuccessful',
    'delegationFailed',
  ]).isRequired,
  txUrl: PropTypes.string,
  isDac: PropTypes.bool,
};

NotificationModal.defaultProps = {
  width: 700,
  minimumPayoutUsdValue: undefined,
  txUrl: undefined,
  isDac: false,
};

export default NotificationModal;
