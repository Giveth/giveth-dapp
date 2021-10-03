import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import Web3 from 'web3';
import ActionNetworkWarning from './ActionNetworkWarning';

const NetworkWarningModal = props => {
  const { show, closeModal, switchNetwork, web3 } = props;
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
      <ActionNetworkWarning incorrectNetwork switchNetwork={switchNetwork} web3={web3} />
    </Modal>
  );
};

NetworkWarningModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  switchNetwork: PropTypes.func,
  web3: PropTypes.instanceOf(Web3),
};

NetworkWarningModal.defaultProps = {
  switchNetwork: () => {},
  web3: undefined,
};

export default NetworkWarningModal;
