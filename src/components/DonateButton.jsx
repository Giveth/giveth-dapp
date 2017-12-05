import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';

import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import { takeActionAfterWalletUnlock } from '../lib/middleware';
import User from '../models/User';
import { displayTransactionError, getGasPrice } from '../lib/helpers';
import GivethWallet from '../lib/blockchain/GivethWallet';

class DonateButton extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      mewAmount: '0',
      modalVisible: false,
      gas: 4,
    };

    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    getNetwork().then(network =>
      this.setState({ MEWurl: `https://www.myetherwallet.com/?to=${network.liquidPledgingAddress.toUpperCase()}&gaslimit=550000&idGiver=0&idReciever=${this.props.model.adminId}` }));
  }


  openDialog() {
    getGasPrice().then(gas =>
      this.setState({
        gas,
        modalVisible: true,
      }));
  }


  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }


  submit(model) {
    console.log(model, this.props.type.toLowerCase(), this.props.model.adminId);

    if (this.props.currentUser) {
      takeActionAfterWalletUnlock(this.props.wallet, () => {
        this.setState({ isSaving: true });
        this.donateWithGiveth(model);
      });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(<p>
            It's great to see that you want to donate, however, you first need to sign up (or sign in).
            Also make sure to transfer some Ether to your Giveth wallet before donating.<br /><br />
            Alternatively, you can donate with MyEtherWallet
                                </p>),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then((isConfirmed) => {
        if (isConfirmed) this.props.history.push('/signup');
      });
    }
  }

  donateWithGiveth(model) {
    const amount = utils.toWei(model.amount);
    const service = feathersClient.service('donations');

    const donate = (etherScanUrl, txHash) => {
      const donation = {
        amount,
        txHash,
        status: 'pending',
      };

      if (this.props.type.toLowerCase() === 'dac') {
        Object.assign(donation, {
          delegate: this.props.model.adminId,
          delegateId: this.props.model.id,
          owner: this.props.currentUser.giverId || '0',
          ownerId: this.props.currentUser,
          ownerType: 'giver',
        });
      } else {
        Object.assign(donation, {
          owner: this.props.model.adminId,
          ownerId: this.props.model.id,
          ownerType: this.props.type.toLowerCase(),
        });
      }

      return service.create(donation)
        .then(() => {
          this.setState({
            isSaving: false,
            amount: 10,
          });

          // For some reason (I suspect a rerender when donations are being fetched again)
          // the skylight dialog is sometimes gone and this throws error
          this.setState({ modalVisible: false });

          let msg;
          if (this.props.type === 'DAC') {
            msg = (
              <div>
                <p>
                  Your donation is pending,
                  <a
                    href={`${etherScanUrl}tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  > view the transaction here.
                  </a>
                  You have full control of this donation and
                  <strong> can take it back at any time</strong>. You will also have a
                  <strong> 3 day window</strong> to veto the use of these funds upon delegation by
                  the dac.
                </p>
                <p>Do make sure to
                  <a
                    href={this.props.communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  > join the community
                  </a> to follow the progress of this DAC.
                </p>
              </div>);
          } else {
            msg = (
              <div>
                <p>Your donation is pending,
                <a
                  href={`${etherScanUrl}tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                > view the transaction here.
                </a>
                </p>
                <p>Do make sure to
                  <a
                    href={this.props.communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  > join the community
                  </a> to follow the progress of this Campaign.
                </p>
              </div>);
          }

          React.swal({
            title: "You're awesome!",
            content: React.swal.msg(msg),
            icon: 'success',
          });
        });
    };

    let txHash;
    let etherScanUrl;
    getNetwork()
      .then((network) => {
        const { liquidPledging } = network;
        etherScanUrl = network.etherscan;

        return liquidPledging.donate(
          this.props.currentUser.giverId || '0',
          this.props.model.adminId, { value: amount },
        )
          .once('transactionHash', (hash) => {
            txHash = hash;
            donate(etherScanUrl, txHash);
          });
      })
      .then(() => {
        React.toast.success(<p>Your donation has been confirmed!<br /><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
      }).catch((e) => {
        console.error(e);
        displayTransactionError(txHash, etherScanUrl);

        this.setState({ isSaving: false });
      });
  }

  render() {
    const { type, model, wallet } = this.props;
    const {
      isSaving, amount, formIsValid, gas, MEWurl, mewAmount,
    } = this.state;
    const style = {
      display: 'inline-block',
    };

    return (
      <span style={style}>
        <button
          className="btn btn-success"
          onClick={this.openDialog}
        >
          Donate
        </button>

        {wallet &&
          <SkyLightStateless
            isVisible={this.state.modalVisible}
            onCloseClicked={() => { this.setState({ modalVisible: false }); }}
            onOverlayClicked={() => { this.setState({ modalVisible: false }); }}
            title={`Support this ${type}!`}
          >
            <strong>Give Ether to support <em>{model.title}</em></strong>

            {['DAC', 'campaign'].indexOf(type) > -1 &&
            <p>Pledge: as long as the {type} owner does not lock your money you can take it back
              any time.
            </p>
            }

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
                  name="amount"
                  id="amount-input"
                  label="How much Ξ do you want to donate?"
                  type="number"
                  value={amount}
                  onChange={(name, value) => this.setState({ mewAmount: value })}
                  placeholder="10"
                  validations={{
                    lessThan: wallet.getBalance() - 0.5,
                    greaterThan: 0.1,
                  }}
                  validationErrors={{
                    greaterThan: 'Minimum value must be at least Ξ0.1',
                    lessThan: 'This donation exceeds your wallet balance. Please remember that you must also pay the transaction fee.',
                  }}
                  required
                  autoFocus
                />
              </div>

              <button
                className="btn btn-success"
                formNoValidate
                type="submit"
                disabled={isSaving || !formIsValid}
              >
                {isSaving ? 'Donating...' : 'Donate Ξ with Giveth'}
              </button>

              <a
                className={`btn btn-secondary ${(isSaving) ? 'disabled' : ''}`}
                disabled={isSaving}
                href={`${MEWurl}&value=${mewAmount}#send-transaction`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate with MyEtherWallet
              </a>
            </Form>

          </SkyLightStateless>
        }
      </span>
    );
  }
}

export default DonateButton;

DonateButton.propTypes = {
  type: PropTypes.string.isRequired,
  model: PropTypes.shape({
    adminId: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
  }).isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  communityUrl: PropTypes.string,
  wallet: PropTypes.instanceOf(GivethWallet),
};

DonateButton.defaultProps = {
  communityUrl: '',
  currentUser: undefined,
  wallet: undefined,
};
