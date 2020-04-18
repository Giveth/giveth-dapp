import React from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import ActionNetworkWarning from './ActionNetworkWarning';
import config from '../configuration';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'scroll',
  },
  overlay: { zIndex: 1000 },
};

Modal.setAppElement('#root');

const NetworkWarningModal = props => {
  const { show, closeModal, networkName } = props;
  return (
    <Modal
      isOpen={show}
      onRequestClose={closeModal}
      contentLabel="Add an item to this Milestone"
      style={modalStyles}
    >
      <div>
        <ActionNetworkWarning incorrectNetwork networkName={networkName} />
      </div>
      <button type="button" className="btn btn-light float-right" onClick={closeModal}>
        Close
      </button>
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
};
HomeRequiredModal.propTypes = {
  show: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
};

export { ForeignRequiredModal, HomeRequiredModal };
