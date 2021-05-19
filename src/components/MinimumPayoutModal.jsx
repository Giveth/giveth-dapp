import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import MinimumPayoutModalContent from './MinimumPayoutModalContent';

const MinimumPayoutModal = ({ show, closeModal, width }) => {
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
        <MinimumPayoutModalContent closeModal={closeModal} />
      </Modal>
    </Fragment>
  );
};

MinimumPayoutModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  width: PropTypes.number,
};

MinimumPayoutModal.defaultProps = {
  width: 700,
};

export default MinimumPayoutModal;
