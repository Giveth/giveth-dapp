/* eslint-disable no-restricted-globals */
import React, { useContext, useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';

import { authenticateUser, checkBalance, checkForeignNetwork } from '../lib/middleware';
import ModalContent from './DelegateMultipleButtonModal';

import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const modalStyles = {
  minWidth: '60%',
  maxWidth: '800px',
};

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {BN}           balance     Current user's balance
 * @prop {User}         currentUser Current user of the Dapp
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Object}       trace   It the delegation is towards campaign, this contains the trace
 * @prop {Object}       style       Styles added to the button
 */
const DelegateMultipleButton = props => {
  const {
    state: { isForeignNetwork, web3, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [modalVisible, setModalVisible] = useState(false);

  async function openDialog() {
    const authenticated = await authenticateUser(currentUser, false, web3);
    if (!authenticated) {
      return;
    }
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() => {
        checkBalance(balance).then(() => {
          setModalVisible(true);
        });
      })
      .catch(console.log);
  }

  return (
    <Fragment>
      <Button
        className="ant-btn-delegate"
        onClick={openDialog}
        block
        size={props.size}
        style={props.style}
      >
        Delegate funds here
      </Button>
      {modalVisible && (
        <Modal
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          centered
          destroyOnClose
          className="pb-0 custom-ant-modal"
          style={modalStyles}
        >
          <ModalContent {...props} setModalVisible={setModalVisible} />
        </Modal>
      )}
    </Fragment>
  );
};

DelegateMultipleButton.propTypes = {
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  style: PropTypes.shape(),
};

DelegateMultipleButton.defaultProps = {
  size: 'middle',
  style: {},
};

export default React.memo(DelegateMultipleButton);
