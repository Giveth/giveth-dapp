import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import MinimumPayoutModalContent from './MinimumPayoutModalContent';
import TransactionModalContent from './TransactionModalContent';

const NotificationModal = ({ show, closeModal, width, type, txUrl, isCommunity, msg }) => {
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
            <TransactionModalContent
              isCommunity={isCommunity}
              txUrl={txUrl}
              type={type}
              msg={msg}
            />
          ) : (
            <MinimumPayoutModalContent closeModal={closeModal} type={type} />
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
  isCommunity: PropTypes.bool,
  msg: PropTypes.string,
};

NotificationModal.defaultProps = {
  width: 700,
  txUrl: undefined,
  isCommunity: false,
  msg: undefined,
};

export default NotificationModal;
