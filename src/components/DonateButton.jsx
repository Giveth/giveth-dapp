/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
import { MiniMeToken } from 'minimetoken';
import { Form, Input } from 'formsy-react-components';

import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import { takeActionAfterWalletUnlock, confirmBlockchainTransaction } from '../lib/middleware';
import User from '../models/User';
import { displayTransactionError, getGasPrice } from '../lib/helpers';
import GivethWallet from '../lib/blockchain/GivethWallet';
import { getWeb3, getHomeWeb3 } from '../lib/blockchain/getWeb3';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';

class DonateButton extends React.Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      modalVisible: false,
      // gasPrice: utils.toWei('4', 'gwei'),
      gasPrice: utils.toWei('10', 'gwei'),
    };

    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    // getNetwork().then(network => {
    //   const { liquidPledging } = network;
    //   const donate = liquidPledging.$contract.methods.donate(0, this.props.model.adminId);
    //   const data = donate.encodeABI();
    //   donate
    //     .estimateGas({
    //       from: '0x0000000000000000000000000000000000000000',
    //       value: 1,
    //     })
    //     .then(gasLimit =>
    //       this.setState({
    //         MEWurl: `https://www.myetherwallet.com/?to=${liquidPledging.$address.toUpperCase()}&gaslimit=${gasLimit}&data=${data}`,
    //       }),
    //     );
    //   this.setState({
    //     MEWurl: `https://www.myetherwallet.com/?to=${liquidPledging.$address.toUpperCase()}&gaslimit=550000&data=${data}`,
    //   });
    // });
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

  // submit(model) {
  //   console.log(model, this.props.type.toLowerCase(), this.props.model.adminId);

  //   if (this.props.currentUser) {
  //   getNetwork().then(network => {
  //     if (this.props.currentUser) {

  //     }
  //   });
  //     // takeActionAfterWalletUnlock(this.props.wallet, () => {
  //       // this.setState({ isSaving: true });
  //       // this.donateWithGiveth(model);
  //     // });
  //   } else {
  //     React.swal({
  //       title: "You're almost there...",
  //       content: React.swal.msg(
  //         <p>
  //           It&#8217;s great to see that you want to donate, however we only support donating
  //           directly in the dapp yet. Use the followng information to donate via{' '}
  //           <a target="_blank" href="https://mycrypto.com/#send-transaction">
  //             MyCrypto
  //           </a>, MyEtherWallet, etc.
  //           <br />
  //           Alternatively, you can donate with MyEtherWallet
  //         </p>,
  //       ),
  //       icon: 'info',
  //       buttons: ['Got it', 'Go to MyCrypto now!'],
  //     }).then(isConfirmed => {
  //       // if (isConfirmed) this.props.history.push('/signup');
  //     });
  //   }
  // }

  mapInputs(inputs) {
    return {
      amount: inputs.amount,
    };
  }

  submit(model) {
    console.log(model, this.props.type.toLowerCase(), this.props.model.adminId);

    if (this.props.currentUser) {
      takeActionAfterWalletUnlock(this.props.wallet, () => {
        this.donateWithBridge(model);
        this.setState({ isSaving: true });
      });
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to donate, however, you first need to sign up (or
            sign in). Also make sure to transfer some Ether to your Giveth wallet before donating.<br />
            <br />
            Alternatively, you can donate with MyEtherWallet
          </p>,
        ),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then(isConfirmed => {
        if (isConfirmed) this.props.history.push('/signup');
      });
    }
  }

  donateWithBridge(model) {
    const { currentUser } = this.props;
    const { adminId } = this.props.model;
    const { gasPrice } = this.state;

    Promise.all([getNetwork(), getHomeWeb3()]).then(([network, homeWeb3]) => {
      const { givethBridge } = network;
      const etherScanUrl = network.foreignEtherscan;
      const value = utils.toWei(model.amount);

      const opts = { from: currentUser.address, gasPrice, value };
      const method = currentUser.giverId
        ? givethBridge.donate(currentUser.giverId, adminId, opts)
        : givethBridge.donateAndCreateGiver(currentUser.address, adminId, opts);

      let txHash;
      method
        .on('transactionHash', transactionHash => {
          txHash = transactionHash;
          this.closeDialog();

          React.toast.info(
            <p>
              Awesome! Your donation is pending...<br />
              <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        })
        .then(receipt => {
          React.toast.success(
            <p>
              Woot! Woot! Donation received. You are awesome!<br />
              Note: because we are bridging networks, there may be a delay before you donation
              appears.<br />
              <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        })
        .catch(e => {
          e = !(e instanceof Error) ? JSON.stringify(e, null, 2) : e;
          ErrorPopup(
            'Something went wrong with your donation.',
            `${etherScanUrl}tx/${txHash} => ${e}`,
          );
        });

      return;
      // console.log('could not send signedTx', e);

      // with ropsten infura, this catch always throws, so we filter that one out
      // if (!e.message.includes('newBlockHeaders')) {
      // ErrorPopup('Something went wrong with the transaction. Please try again', e);
      // }
      // });

      // const gas = 30400;
      // const data = currentUser.giverId
      // ? givethBridge.$contract.methods.donate(currentUser.giverId, adminId).encodeABI()
      // : givethBridge.$contract.methods
      // .donateAndCreateGiver(currentUser.address, adminId)
      // .encodeABI();

      const to = givethBridge.$address;
      const query = `?to=${to}&value=${value}&gasLimit=25400&data=${data}&gasPrice=${gasPrice}`;
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
    });
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

      return service.create(donation).then(() => {
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
                <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  {' '}
                  view the transaction here.
                </a>
                You have full control of this donation and
                <strong> can take it back at any time</strong>. You will also have a
                <strong> 3 day window</strong> to veto the use of these funds upon delegation by the
                DAC.
              </p>
              <p>
                Do make sure to
                <a href={this.props.communityUrl} target="_blank" rel="noopener noreferrer">
                  {' '}
                  join the Community
                </a>{' '}
                to follow the progress of this DAC.
              </p>
            </div>
          );
        } else {
          msg = (
            <div>
              <p>
                Your donation is pending,
                <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  {' '}
                  view the transaction here.
                </a>
              </p>
              <p>
                Do make sure to
                <a href={this.props.communityUrl} target="_blank" rel="noopener noreferrer">
                  {' '}
                  join the Community
                </a>{' '}
                to follow the progress of this Campaign.
              </p>
            </div>
          );
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
    const doDonate = () =>
      Promise.all([getNetwork(), getWeb3(), getHomeWeb3()])
        .then(([network, web3, ropstenWeb3]) => {
          const { tokenAddress, liquidPledgingAddress } = network;
          etherScanUrl = network.etherscan;
          const token = new MiniMeToken(web3, tokenAddress);

          const giverId = this.props.currentUser.giverId || '0';
          const { adminId } = this.props.model;

          const data = `0x${utils.padLeft(utils.toHex(giverId).substring(2), 16)}${utils.padLeft(
            utils.toHex(adminId).substring(2),
            16,
          )}`;

          return token
            .approveAndCall(liquidPledgingAddress, amount, data, {
              from: this.props.currentUser.address,
              gas: 1000000,
            })
            .once('transactionHash', hash => {
              txHash = hash;
              donate(etherScanUrl, txHash);
            });
        })
        .then(() => {
          React.toast.success(
            <p>
              Your donation has been confirmed!<br />
              <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        })
        .catch(e => {
          console.error(e);
          displayTransactionError(txHash, etherScanUrl);

          this.setState({ isSaving: false });
        });

    // Donate
    confirmBlockchainTransaction(doDonate, () => this.setState({ isSaving: false }));
  }

  render() {
    const { type, model, wallet } = this.props;
    const { amount, gasPrice, formIsValid, isSaving } = this.state;
    const style = {
      display: 'inline-block',
    };

    return (
      <span style={style}>
        <button className="btn btn-success" onClick={this.openDialog}>
          Donate
        </button>

        {wallet && (
          <SkyLightStateless
            isVisible={this.state.modalVisible}
            onCloseClicked={() => this.closeDialog()}
            onOverlayClicked={() => this.closeDialog()}
            title={`Support this ${type}!`}
          >
            <strong>
              Give Ether to support <em>{model.title}</em>
            </strong>

            {type === 'DAC' && (
              <p>
                Pledge: as long as the {type} owner does not lock your money you can take it back
                any time.
              </p>
            )}

            <p>
              {/* Your wallet balance: <em>&#926;{wallet.getTokenBalance()}</em> */}
              {/* <br /> */}
              Gas price: <em>{utils.fromWei(gasPrice, 'gwei') * 10} Gwei</em>
            </p>

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
                  placeholder="1"
                  validations={{
                    // lessThan: wallet.getTokenBalance() - 0.5,
                    greaterThan: 0.009,
                  }}
                  validationErrors={{
                    greaterThan: 'Minimum value must be at least Ξ0.01',
                    // lessThan:
                    // 'This donation exceeds your Giveth wallet balance. Please top up your wallet or donate with MyEtherWallet.',
                  }}
                  required
                  autoFocus
                />
              </div>

              {/* <button
                className="btn btn-success"
                formNoValidate
                type="submit"
                disabled={isSaving || !formIsValid}
              >
                {isSaving ? 'Donating...' : 'Donate Ξ with Giveth'}
              </button> */}

              <LoaderButton
                className="btn btn-success"
                formNoValidate
                type="submit"
                disabled={isSaving || !formIsValid}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Donate with Giveth
              </LoaderButton>

              {/*<a
                 className={`btn btn-secondary ${isSaving ? 'disabled' : ''}`}
                 disabled={isSaving}
                 href={`${MEWurl}&value=${mewAmount}#send-transaction`}
                 target="_blank"
                 rel="noopener noreferrer"
               >
                Manually Donate (advanced)
              </a> */}
            </Form>
          </SkyLightStateless>
        )}
      </span>
    );
  }
}

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

export default DonateButton;
