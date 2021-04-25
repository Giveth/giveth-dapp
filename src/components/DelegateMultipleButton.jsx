/* eslint-disable no-restricted-globals */
import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import 'react-rangeslider/lib/index.css';

import { checkBalance, isLoggedIn } from '../lib/middleware';
import ModalContent from './DelegateMultipleButtonModal';

import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

Modal.setAppElement('#root');

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    minWidth: '40%',
    maxWidth: '80%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'auto',
    maxHeight: '64%',
    minHeight: '350px',
  },
};

const closeButtonStyle = {
  position: 'absolute',
  top: '0px',
  right: '0px',
};

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {BN}           balance     Current user's balance
 * @prop {User}         currentUser Current user of the Dapp
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Object}       milestone   It the delegation is towards campaign, this contains the milestone
 * @prop {Object}       style       Styles added to the button
 */
const DelegateMultipleButton = props => {
  const style = { display: 'inline-block', ...props.style };

  const {
    state: { isForeignNetwork, validProvider, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [modalVisible, setModalVisible] = useState(false);

  function openDialog() {
    isLoggedIn(currentUser)
      .then(() => checkBalance(balance))
      .then(() => {
        setModalVisible(true);
      });
  }

  return (
    <span style={style}>
      <button
        type="button"
        className="btn btn-info"
        onClick={() => {
          if (validProvider && !isForeignNetwork) {
            displayForeignNetRequiredWarning();
          } else {
            openDialog();
          }
        }}
      >
        Delegate funds here
      </button>

      <Modal
        isOpen={modalVisible}
        style={modalStyles}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <button
          type="button"
          className="btn btn-sm"
          style={closeButtonStyle}
          onClick={() => {
            setModalVisible(false);
          }}
        >
          <i className="fa fa-close" />
        </button>
        <ModalContent {...props} setModalVisible={setModalVisible} />
      </Modal>
    </span>
  );
};

DelegateMultipleButton.propTypes = {
  style: PropTypes.shape(undefined),
};

DelegateMultipleButton.defaultProps = {
  style: {},
};

export default React.memo(DelegateMultipleButton);
