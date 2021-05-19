import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import MinimumPayoutModalContent from './MinimumPayoutModalContent';

const NotificationModal = ({ show, closeModal, width, minimumPayoutUsdValue, type }) => {
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
          <MinimumPayoutModalContent
            closeModal={closeModal}
            minimumPayoutUsdValue={minimumPayoutUsdValue}
            type={type}
          />
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
  type: PropTypes.oneOf(['Creat/Edit', 'MarkComplete', 'Archive', 'Collect/Disburse']).isRequired,
};

NotificationModal.defaultProps = {
  width: 700,
  minimumPayoutUsdValue: undefined,
};

export default NotificationModal;
