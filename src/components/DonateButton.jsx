/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
import { MiniMeToken } from 'minimetoken';
import { Form, Input } from 'formsy-react-components';

import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import User from '../models/User';
import DAC from '../models/DAC';
import Donation from '../models/Donation';
import { displayTransactionError, getGasPrice } from '../lib/helpers';
import GivethWallet from '../lib/blockchain/GivethWallet';
import { getWeb3, getHomeWeb3 } from '../lib/blockchain/getWeb3';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import DonationService from '../services/DonationService';

// tx only requires 25400 gas, but for some reason we get an out of gas
// error in web3 with that amount (even though the tx succeeds)
const DONATION_GAS = 30400;

class DonateButton extends React.Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      balance: 0,
      homeWeb3: undefined,
      validNetwork: false,
      account: undefined,
      givethBridge: undefined,
      etherscanUrl: '',
      modalVisible: false,
      gasPrice: 10,
    };

    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    getNetwork().then(network => {
      this.setState({ givethBridge: network.givethBridge, etherscanUrl: network.foreignEtherscan });
    });
    getHomeWeb3().then(homeWeb3 => {
      this.setState({
        homeWeb3,
      });

      if (!homeWeb3) {
        this.setState({ validNetwork: false });
      } else {
        let account;
        // poll for account & network changes
        const poll = () => {
          homeWeb3.eth.net.getId().then(netId => {
            const validNetwork =
              (netId === 1 && config.homeNetworkName === 'Mainnet') ||
              (netId > 42 && config.homeNetworkName === 'Home Ganache') ||
              (netId === 3 && config.homeNetworkName === 'Ropsten');

            if (validNetwork !== this.state.validNetwork) {
              this.setState({ validNetwork });
            }
          });

          homeWeb3.eth.getAccounts().then(accounts => {
            if (this.state.account !== accounts[0]) {
              account = accounts[0];

              if (account) {
                homeWeb3.eth.getBalance(account).then(bal => {
                  this.setState({
                    balance: homeWeb3.utils.fromWei(bal),
                    account,
                  });
                });
              } else {
                this.setState({ account });
              }
            }
          });
        };
        setInterval(poll, 1000);
        poll();
      }
    });

    getGasPrice().then(gasPrice =>
      this.setState({
        gasPrice: utils.fromWei(gasPrice, 'gwei'),
      }),
    );
  }

  openDialog() {
    this.refs.amountInput.resetValue();
    this.setState({
      modalVisible: true,
      amount: '',
      formIsValid: false,
    });
  }

  closeDialog() {
    this.setState({
      modalVisible: false,
      amount: '',
      formIsValid: false,
    });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  mapInputs(inputs) {
    return {
      amount: inputs.amount,
    };
  }

  getDonationData() {
    const { givethBridge, account } = this.state;
    const { currentUser } = this.props;
    const { adminId } = this.props.model;

    if (currentUser) {
      // TODO do we want to donate in the name of the rinkeby account automatically?
      return currentUser.giverId > 0
        ? givethBridge.$contract.methods.donate(currentUser.giverId, adminId).encodeABI()
        : givethBridge.$contract.methods
            .donateAndCreateGiver(currentUser.address, adminId)
            .encodeABI();
    }
    return givethBridge.$contract.methods.donateAndCreateGiver(account, adminId).encodeABI();
  }

  submit(model) {
    // TODO how to handle k from non users
    // if (this.props.currentUser) {
    this.donateWithBridge(model);
    this.setState({ isSaving: true });
    // } else {
    //   React.swal({
    //     title: "You're almost there...",
    //     content: React.swal.msg(
    //       <p>
    //         It&#8217;s great to see that you want to donate, however, you first need to sign up (or
    //         sign in). Also make sure to transfer some Ether to your Giveth wallet before donating.<br />
    //         <br />
    //         Alternatively, you can donate with MyEtherWallet
    //       </p>,
    //     ),
    //     icon: 'info',
    //     buttons: ['Cancel', 'Sign up now!'],
    //   }).then(isConfirmed => {
    //     if (isConfirmed) this.props.history.push('/signup');
    //   });
    // }
  }

  donateWithBridge(model) {
    const { currentUser } = this.props;
    const { adminId } = this.props.model;
    const { gasPrice, account, givethBridge, etherscanUrl } = this.state;

    const value = utils.toWei(model.amount);

    const opts = { value, gas: DONATION_GAS, from: account };
    let method;
    if (currentUser) {
      // TODO do we want to donate in the name of the rinkeby account automatically?
      method =
        currentUser.giverId > 0
          ? givethBridge.donate(currentUser.giverId, adminId, opts)
          : givethBridge.donateAndCreateGiver(currentUser.address, adminId, opts);
    } else {
      method = givethBridge.donateAndCreateGiver(account, adminId, opts);
    }

    let txHash;
    method
      .on('transactionHash', async transactionHash => {
        txHash = transactionHash;
        this.closeDialog();

        await DonationService.newFeathersDonation(
          currentUser || { address: account },
          this.props.model,
          value,
          txHash,
        );

        this.setState({
          modalVisible: false,
          isSaving: false,
        });

        React.toast.info(
          <p>
            Awesome! Your donation is pending...<br />
            <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>,
        );
      })
      .then(receipt => {
        React.toast.success(
          <p>
            Woot! Woot! Donation received. You are awesome!<br />
            Note: because we are bridging networks, there will be a delay before your donation
            appears.<br />
            <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>,
        );
      })
      .catch(e => {
        e = !(e instanceof Error) ? JSON.stringify(e, null, 2) : e;
        ErrorPopup(
          'Something went wrong with your donation.',
          `${etherscanUrl}tx/${txHash} => ${e}`,
        );
      });

    return;

    // const gas = 30400;
    // const data = currentUser.giverId
    // ? givethBridge.$contract.methods.donate(currentUser.giverId, adminId).encodeABI()
    // : givethBridge.$contract.methods
    // .donateAndCreateGiver(currentUser.address, adminId)
    // .encodeABI();

    const to = givethBridge.$address;
    const query = `?to=${to}&value=${value}&gasLimit=25400&data=${data}&gasPrice=${utils.toWei(
      gasPrice,
      'gwei',
    )}`;
    this.setState({
      modalVisible: true,
    });

    React.swal({
      className: 'swal-huge',
      title: "You're almost there...",
      content: React.swal.msg(
        <div>
          <p>
            It&#8217;s great to see that you want to donate, however we don't support donating
            directly in the dapp yet. Use the followng information to donate via
            {/* <a target="_blank" href={`https://mycrypto.com/${query}#send-transaction`}> */}
            {/* MyCrypto */}
            {/* </a>, MyEtherWallet, etc. */}
            MyCrypto, MyEtherWallet, etc.
            {/* <a target="_blank" href={`https://myetherwallet.com/${query}#send-transaction`}> */}
            {/* MyEtherWallet, */}
            {/* </a>, etc. */}
          </p>
          <div className="alert alert-danger">
            <b style={{ color: '#e4000b' }}>NOTE: DO NOT SEND MAINNET ETHER.</b>
          </div>
          <div className="alert alert-danger">
            <b style={{ color: '#e4000b' }}>
              NOTE: You must choose the "Ropsten" network to send the tx
            </b>
          </div>
          <p>Use the following data to make your transaction:</p>
          <div className="container alert alert-info text-left">
            <div className="row">
              <div className="col-sm-2">
                <b>to:</b>
              </div>
              <div className="col-sm-10" style={{ wordWrap: 'break-word' }}>
                {to}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-2">
                <b>value:</b>
              </div>
              <div className="col-sm-10" style={{ wordWrap: 'break-word' }}>
                {value}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-2">
                <b>gasLimit:</b>
              </div>
              <div className="col-sm-10" style={{ wordWrap: 'break-word' }}>
                {gas}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-2">
                <b>data:</b>
              </div>
              <div className="col-sm-10" style={{ wordWrap: 'break-word' }}>
                {data}
              </div>
            </div>
          </div>
        </div>,
      ),
      icon: 'info',
      buttons: ['I changed my mind', 'Go to MyCrypto now!'],
    }).then(isConfirmed => {
      if (isConfirmed) window.open(`https://mycrypto.com/${query}#send-transaction`);
    });
  }

  render() {
    const { model, currentUser } = this.props;
    const {
      homeWeb3,
      account,
      validNetwork,
      balance,
      givethBridge,
      amount,
      gasPrice,
      formIsValid,
      isSaving,
    } = this.state;
    const style = {
      display: 'inline-block',
    };

    return (
      <span style={style}>
        <button className="btn btn-success" onClick={this.openDialog}>
          Donate
        </button>

        <SkyLightStateless
          isVisible={this.state.modalVisible}
          onCloseClicked={() => this.closeDialog()}
          onOverlayClicked={() => this.closeDialog()}
          title={`Support this ${model.type}!`}
        >
          {homeWeb3 &&
            !homeWeb3.givenProvider && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It is recommended that you install <a href="https://metamask.io/">MetaMask</a> to
                donate
              </div>
            )}
          <strong>
            Give Ether to support <em>{model.title}</em>
          </strong>

          {model.type === DAC.type && (
            <p>
              Pledge: as long as the {model.type} owner does not lock your money you can take it
              back any time.
            </p>
          )}
          {/* TODO add note that we are donating as the logged in user, or that they won't be able to manage funds if no logged in user & using metamask*/}

          {homeWeb3 &&
            homeWeb3.givenProvider &&
            !validNetwork && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like you are connected to the wrong network. Please connect to the{' '}
                <strong>{config.homeNetworkName}</strong> network to donate
              </div>
            )}
          {homeWeb3 &&
            homeWeb3.givenProvider &&
            !account && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like your account is locked.
              </div>
            )}
          {homeWeb3 &&
            homeWeb3.givenProvider &&
            account &&
            validNetwork && (
              <p>
                {config.homeNetworkName} balance: <em>&#926;{balance}</em>
                <br />
                Gas price: <em>{gasPrice} Gwei</em>
              </p>
            )}

          <Form
            onSubmit={this.submit}
            mapping={inputs => this.mapInputs(inputs)}
            onValid={() => this.toggleFormValid(true)}
            onInvalid={() => this.toggleFormValid(false)}
            layout="vertical"
          >
            <div className="form-group">
              <Input
                name="amount"
                ref="amountInput"
                id="amount-input"
                label="How much Ξ do you want to donate?"
                type="number"
                value={amount}
                onChange={amount => /*TODO fixme*/ {}}
                placeholder="1"
                validations={{
                  lessOrEqualTo: homeWeb3 ? balance : 10000000000000000,
                  greaterThan: 0.009,
                }}
                validationErrors={{
                  greaterThan: 'Minimum value must be at least Ξ0.01',
                  lessOrEqualTo: 'This donation exceeds your wallet balance.',
                }}
                required
                autoFocus
              />
            </div>

            {homeWeb3 &&
              homeWeb3.givenProvider && (
                <LoaderButton
                  className="btn btn-success"
                  formNoValidate
                  type="submit"
                  disabled={isSaving || !formIsValid || !validNetwork || !account}
                  isLoading={isSaving}
                  loadingText="Saving..."
                >
                  Donate
                </LoaderButton>
              )}

            {!homeWeb3 && currentUser && <div>TODO: show donation data</div>}

            {/* TODO get amount to dynamically update */}
            {givethBridge &&
              (account || currentUser) && (
                <a
                  className={`btn btn-secondary ${isSaving ? 'disabled' : ''}`}
                  disabled={!givethBridge || !amount}
                  href={`https://mycrypto.com?to=${
                    givethBridge.$address
                  }&data=${this.getDonationData()}&value=${amount}&gasLimit=${DONATION_GAS}#send-transaction`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Donate via MyCrypto
                </a>
              )}
          </Form>
        </SkyLightStateless>
      </span>
    );
  }
}

DonateButton.propTypes = {
  model: PropTypes.shape({
    type: PropTypes.string.isRequired,
    adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    id: PropTypes.string.isRequired,
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

export default DonateButton;
