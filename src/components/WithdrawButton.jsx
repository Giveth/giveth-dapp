import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SkyLightStateless } from 'react-skylight';
import { Form, Input } from 'formsy-react-components';

import { takeActionAfterWalletUnlock } from '../lib/middleware';
import User from '../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';
import WalletService from '../services/Wallet';
import { getGasPrice, confirmBlockchainTransaction } from '../lib/helpers';


class WithdrawButton extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      modalVisible: false,
      to: '',
      gas: 4,
    };

    this.submit = this.submit.bind(this);
    this.afterCreate = this.afterCreate.bind(this);
  }

  openDialog() {
    getGasPrice().then(gas =>
      this.setState({
        gas,
        modalVisible: true,
      }));
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
            <a
              href={`${etherScanUrl}tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            > view the transaction here.
            </a>
        </p>
      </div>);

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
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      this.setState({ isSaving: true });

      const withdraw = () => WalletService.withdraw(
        {
          from: this.props.currentUser.address,
          to: model.to,
          value: `${model.amount}`,
        },
        this.afterCreate,
        (etherScanUrl, txHash) => {
          React.toast.success(<p>Your withdrawal has been confirmed!<br /><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
        },
        (err) => { console.log(err); },
      );


      // Withdraw the money
      confirmBlockchainTransaction(
        withdraw,
        () => this.setState({ isSaving: false }),
      );
    });
  }

  render() {
    const { wallet } = this.props;
    const {
      isSaving, amount, formIsValid, gas, to,
    } = this.state;
    const style = {
      display: 'inline-block',
    };

    return (
      <span style={style}>
        <button
          className="btn btn-info"
          onClick={() => this.openDialog()}
        >
          Withdraw
        </button>

        {wallet &&
          <SkyLightStateless
            isVisible={this.state.modalVisible}
            onCloseClicked={() => { this.setState({ modalVisible: false }); }}
            onOverlayClicked={() => { this.setState({ modalVisible: false }); }}
          >
            <strong>Withdrawing from your Giveth wallet</strong>

            <p>Your wallet balance: <em>&#926;{wallet.getBalance()}</em><br />
              Gas price: <em>{gas} Gwei</em>
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
                  id="amount-input"
                  label="How much Ξ do you want to withdraw?"
                  type="number"
                  value={amount}
                  validations={{
                    lessThan: wallet.getBalance() - 0.1,
                    greaterThan: 0.0099999999999,
                  }}
                  validationErrors={{
                    greaterThan: 'Minimum value must be at least Ξ0.01',
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
                {isSaving ? 'Withdrawing...' : 'Withdraw Ξ'}
              </button>
            </Form>

          </SkyLightStateless>
        }
      </span>
    );
  }
}

WithdrawButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default WithdrawButton;
