import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { Form, Input } from 'formsy-react-components';

import User from '../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';
import WalletService from '../services/WalletService';
import { getGasPrice } from '../lib/helpers';
import config from '../configuration';

import ErrorPopup from './ErrorPopup';
import { actionWithLoggedIn } from '../lib/middleware';

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
};

Modal.setAppElement('#root');

class WithdrawButton extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      modalVisible: false,
      to: '',
      gasPrice: 4,
    };

    this.submit = this.submit.bind(this);
    this.afterCreate = this.afterCreate.bind(this);
  }

  openDialog() {
    actionWithLoggedIn(this.props.currentUser).then(() =>
      getGasPrice().then(gasPrice =>
        this.setState({
          gasPrice,
          modalVisible: true,
        }),
      ),
    );
  }

  afterCreate(etherScanUrl, txHash) {
    this.setState({
      isSaving: false,
      modalVisible: false,
    });

    const msg = (
      <div>
        <p>
          Your withdrawal is pending,
          <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            {' '}
            view the transaction here.
          </a>
        </p>
      </div>
    );

    React.swal({
      title: 'Withdrawing money',
      content: React.swal.msg(msg),
      icon: 'success',
    });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  submit(model) {
    this.setState({ isSaving: true });

    WalletService.withdraw(
      {
        from: this.props.currentUser.address,
        to: model.to,
        value: `${model.amount}`,
      },
      this.afterCreate,
      (etherScanUrl, txHash) => {
        React.toast.success(
          <p>
            Your withdrawal has been confirmed!
            <br />
            <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>,
        );
      },
      err => {
        ErrorPopup('Something went wrong with withdrawal. Please try again after refresh.', err);
      },
    );
  }

  render() {
    const { wallet } = this.props;
    const { isSaving, amount, formIsValid, gasPrice, to } = this.state;
    const style = {
      display: 'inline-block',
    };

    return (
      <span style={style}>
        <button type="button" className="btn btn-info" onClick={() => this.openDialog()}>
          Withdraw
        </button>

        {wallet && (
          <Modal
            isOpen={this.state.modalVisible}
            onCloseClicked={() => {
              this.setState({ modalVisible: false });
            }}
            style={modalStyles}
          >
            <strong>Withdrawing from your Giveth wallet</strong>

            <p>
              Your wallet balance:{' '}
              <em>
                {wallet.getBalance()} {config.nativeTokenName}
              </em>
              Gas price: <em>{gasPrice} Gwei</em>
            </p>

            <Form
              onSubmit={this.submit}
              mapping={this.mapInputs}
              onValid={() => this.toggleFormValid(true)}
              onInvalid={() => this.toggleFormValid(false)}
              layout="vertical"
            >
              <div className="form-group">
                <Input
                  name="to"
                  id="to-input"
                  label="To which address do you want to send ether?"
                  type="text"
                  value={to}
                  validations="isEtherAddress"
                  validationErrors={{
                    isEtherAddress: 'Please check that the address you have provided is valid.',
                  }}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <Input
                  name="amount"
                  label={`How much ${config.nativeTokenName} do you want to withdraw?`}
                  type="number"
                  step="any"
                  value={amount}
                  validations={{
                    lessThan: wallet.getBalance() - 0.1,
                    greaterThan: 0,
                  }}
                  validationErrors={{
                    greaterThan: `Please enter value greater than 0 ${config.nativeTokenName}`,
                    lessThan: 'This withdrawal amount exceeds your wallet balance.',
                  }}
                  required
                />
              </div>

              <button
                className="btn btn-success"
                formNoValidate
                type="submit"
                disabled={isSaving || !formIsValid}
              >
                {isSaving ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </Form>
          </Modal>
        )}
      </span>
    );
  }
}

WithdrawButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default WithdrawButton;
