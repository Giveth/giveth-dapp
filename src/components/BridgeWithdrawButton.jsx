import { utils } from 'web3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { Form, Input } from 'formsy-react-components';
import SelectFormsy from './SelectFormsy';

import User from '../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';
import WalletService from '../services/WalletService';
import { getGasPrice } from '../lib/helpers';
import config from '../configuration';

import ErrorPopup from './ErrorPopup';

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

class BridgeWithdrawButton extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      token: '',
      tokenOptions: Object.keys(config.tokenAddresses).map(t => ({
        value: config.tokenAddresses[t],
        title: t,
      })),
      amount: '',
      modalVisible: false,
      gasPrice: 4,
    };

    this.submit = this.submit.bind(this);
    this.afterCreate = this.afterCreate.bind(this);
  }

  openDialog() {
    getGasPrice().then(gasPrice =>
      this.setState({
        gasPrice: utils.fromWei(gasPrice, 'gwei'),
        modalVisible: true,
      }),
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
      title: 'Withdrawing via bridge',
      content: React.swal.msg(msg),
      icon: 'success',
    });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  submit(model) {
    this.setState({ isSaving: true });

    WalletService.bridgeWithdraw(
      {
        addr: this.props.currentUser.address,
        value: `${model.amount}`,
        token: `${model.token}`,
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
    const { tokenAddresses } = config;
    const { isSaving, amount, formIsValid, gasPrice, token, tokenOptions } = this.state;
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
            onRequestClose={() => {
              this.setState({ modalVisible: false });
            }}
            style={modalStyles}
          >
            <p>
              <strong>Withdrawing via bridge from your Giveth wallet</strong>
            </p>

            {Object.keys(tokenAddresses).map(t => (
              <p>
                <strong>{t}</strong> balance: <em>{wallet.getTokenBalance(tokenAddresses[t])}</em>
              </p>
            ))}
            <p>
              Gas price: <em>{gasPrice} Gwei</em>
            </p>

            <Form
              onSubmit={this.submit}
              mapping={this.mapInputs}
              onValid={() => this.toggleFormValid(true)}
              onInvalid={() => this.toggleFormValid(false)}
              layout="vertical"
            >
              <SelectFormsy
                name="token"
                id="token-select"
                label="Select a Token"
                helpText="The token you would like to withdraw."
                value={token}
                cta="--- Select a token ---"
                options={tokenOptions}
                required
              />
              <div className="form-group">
                <Input
                  name="amount"
                  label="How much do you want to withdraw?"
                  type="number"
                  step="any"
                  value={amount}
                  validations={
                    {
                      // lessThan: wallet.getTokenBalance(token), TODO enable this
                    }
                  }
                  validationErrors={{
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

BridgeWithdrawButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default BridgeWithdrawButton;
