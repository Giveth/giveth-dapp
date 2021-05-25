import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import MinimumPayoutModalContent from './MinimumPayoutModalContent';
import TransactionModalContent from './TransactionModalContent';

const NotificationModal = ({ show, closeModal, width, type, txUrl, isDac, msg }) => {
  const donationDelegationTypes = [
    'donationPending',
    'donationSuccessful',
    'donationFailed',
    'delegationPending',
    'delegationSuccessful',
    'delegationFailed',
  ];
  console.log(show);
  return (
    <Fragment>
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
          <TransactionModalContent isDac={isDac} txUrl={txUrl} type={type} msg={msg} />
        ) : (
          <MinimumPayoutModalContent closeModal={closeModal} type={type} />
        )}
      </Modal>
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
  isDac: PropTypes.bool,
  msg: PropTypes.string,
};

NotificationModal.defaultProps = {
  width: 700,
  txUrl: undefined,
  isDac: false,
  msg: undefined,
};

const ModalHandler = ({ type }) => {
  const [modalVisible, setModalVisible] = useState(true);
  return (
    <NotificationModal show={modalVisible} closeModal={() => setModalVisible(false)} type={type} />
  );
};

ModalHandler.propTypes = {
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
};

const CreateEditMinPayoutModal = () => {
  console.log('CreateEditMinPayoutModal');
  return <ModalHandler type="Creat/Edit" />;
};

export { CreateEditMinPayoutModal };
