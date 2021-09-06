import React, { Fragment, useContext, useState } from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';

import Donation from 'models/Donation';
import { authenticateUser, checkBalance } from '../../../lib/middleware';
import DelegateButtonModal from './DelegateButtonModal';
import ErrorHandler from '../../../lib/ErrorHandler';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as ConversionRateContext } from '../../../contextProviders/ConversionRateProvider';
import { Context as UserContext } from '../../../contextProviders/UserProvider';

const modalStyles = {
  minWidth: '60%',
  maxWidth: '800px',
};

const bodyElement = document.getElementsByTagName('body');

// FIXME: We need slider component that uses bignumber, there are some precision issues here
const DelegateButton = props => {
  const {
    state: { web3, isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [modalVisible, setModalVisible] = useState(false);

  const openDialog = async () => {
    const authenticated = await authenticateUser(currentUser, false, web3);
    if (!authenticated) {
      return;
    }

    if (!isForeignNetwork) {
      displayForeignNetRequiredWarning();
      return;
    }

    checkBalance(balance)
      .then(() => {
        // Hide overflow when modal opens due to Ant select dropdown bug
        bodyElement[0].classList.add('overflow-hidden');
        setModalVisible(true);
      })
      .catch(err => ErrorHandler(err, 'Something went wrong on getting user balance.'));
  };

  const closeDialog = () => {
    // Show overflow when modal closes due to Ant select dropdown bug
    bodyElement[0].classList.remove('overflow-hidden');
    setModalVisible(false);
  };

  return (
    <Fragment>
      <button type="button" className="btn btn-success btn-sm" onClick={openDialog}>
        Delegate
      </button>

      <Modal
        visible={modalVisible}
        onCancel={closeDialog}
        footer={null}
        centered
        destroyOnClose
        className="pb-0 custom-ant-modal"
        style={modalStyles}
      >
        <DelegateButtonModal
          {...props}
          web3={web3}
          closeDialog={closeDialog}
          getConversionRates={getConversionRates}
        />
      </Modal>
    </Fragment>
  );
};

DelegateButton.propTypes = {
  traceOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
};

DelegateButton.defaultProps = {
  traceOnly: false,
};

export default DelegateButton;
