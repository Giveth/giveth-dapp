import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import ActionNetworkWarning from './ActionNetworkWarning';
import config from '../configuration';

const NetworkWarningModal = props => {
  const { show, closeModal, networkName } = props;
  return (
    <Modal
      visible={show}
      onOk={closeModal}
      onCancel={closeModal}
      title="Wrong Network"
      centered
      footer={[
        <Button key="back" onClick={closeModal} type="primary">
          Return
        </Button>,
      ]}
    >
      <div>
        <ActionNetworkWarning incorrectNetwork networkName={networkName} />
      </div>
    </Modal>
  );
};

NetworkWarningModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  networkName: PropTypes.string.isRequired,
};

const ForeignRequiredModal = props => {
  return <NetworkWarningModal networkName={config.foreignNetworkName} {...props} />;
};
const HomeRequiredModal = props => {
  return <NetworkWarningModal networkName={config.foreignNetworkName} {...props} />;
};

ForeignRequiredModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string.isRequired,
};
HomeRequiredModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string.isRequired,
};

export { ForeignRequiredModal, HomeRequiredModal };
