import React, { Component } from 'react';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';

import PropTypes from 'prop-types';
import 'react-rangeslider/lib/index.css';

import Donation from 'models/Donation';
import ErrorPopup from './ErrorPopup';
import { authenticateUser, checkBalance } from '../lib/middleware';
import User from '../models/User';
import DelegateButtonModal from './DelegateButtonModal';

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
    maxHeight: '80%',
    minHeight: '400px',
    marginTop: '10px',
  },
};

Modal.setAppElement('#root');

// FIXME: We need slider component that uses bignumbers, there are some precision issues here
class DelegateButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalVisible: false,
    };
    this.closeDialog = this.closeDialog.bind(this);
  }

  async openDialog() {
    const authenticated = await authenticateUser(this.props.currentUser, false);
    if (!authenticated) {
      return;
    }
    checkBalance(this.props.balance)
      .then(() => {
        this.setState({
          modalVisible: true,
        });
      })
      .catch(err => {
        // error code 4001 means user has canceled the transaction
        if (err.code !== 4001) {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        }
      });
  }

  closeDialog() {
    this.setState({
      modalVisible: false,
    });
  }

  render() {
    const style = { display: 'inline-block' };

    return (
      <span style={style}>
        <button type="button" className="btn btn-success btn-sm" onClick={() => this.openDialog()}>
          Delegate
        </button>

        <Modal
          isOpen={this.state.modalVisible}
          onRequestClose={this.closeDialog}
          shouldCloseOnOverlayClick={false}
          contentLabel="Delegate Donation"
          style={modalStyles}
        >
          <DelegateButtonModal {...this.props} closeDialog={this.closeDialog} />
        </Modal>
      </span>
    );
  }
}

DelegateButton.propTypes = {
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  types: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  traceOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
};

DelegateButton.defaultProps = {
  traceOnly: false,
};

export default DelegateButton;
