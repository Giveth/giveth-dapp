import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
// import { Form, Input } from 'formsy-react-components';

import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import {
  takeActionAfterWalletUnlock,
  confirmBlockchainTransaction,
} from '../lib/middleware';
import User from '../models/User';
import { displayTransactionError, getGasPrice } from '../lib/helpers';
import BaseWallet from '../lib/blockchain/BaseWallet';
import getWeb3 from '../lib/blockchain/getWeb3';
import { MiniMeToken } from 'minimetoken';

class DonateButton extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: '',
      mewAmount: '0',
      modalVisible: false,
      gasPrice: utils.toWei('4', 'gwei'),
    };

    this.submit = this.submit.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    // getNetwork().then(network => {
    // const { liquidPledging } = network;
    // const donate = liquidPledging.$contract.methods.donate(
    //   0,
    //   this.props.model.adminId,
    // );
    // const data = donate.encodeABI();
    // donate
    //   .estimateGas({
    //     from: '0x0000000000000000000000000000000000000000',
    //     value: 1,
    //   })
    //   .then(gasLimit =>
    //     this.setState({
    //       MEWurl: `https://www.myetherwallet.com/?to=${liquidPledging.$address.toUpperCase()}&gaslimit=${gasLimit}&data=${data}`,
    //     }),
    //   );
    //
    // this.setState({
    //   MEWurl: `https://www.myetherwallet.com/?to=${liquidPledging.$address.toUpperCase()}&gaslimit=550000&data=${data}`,
    // });
    // });
  }

  openDialog() {
    getGasPrice().then(gasPrice =>
      this.setState({
        gasPrice,
        modalVisible: true,
      }),
    );
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
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to donate, however, you first
            need to sign up (or sign in). Also make sure to transfer some Ether
            to your Giveth wallet before donating.<br />
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
                <a
                  href={`${etherScanUrl}tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {' '}
                  view the transaction here.
                </a>
                You have full control of this donation and
                <strong> can take it back at any time</strong>. You will also
                have a
                <strong> 3 day window</strong> to veto the use of these funds
                upon delegation by the DAC.
              </p>
              <p>
                Do make sure to
                <a
                  href={this.props.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
                <a
                  href={`${etherScanUrl}tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {' '}
                  view the transaction here.
                </a>
              </p>
              <p>
                Do make sure to
                <a
                  href={this.props.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
      Promise.all([getNetwork(), getWeb3()])
        .then(([network, web3]) => {
          const { tokenAddress, liquidPledgingAddress } = network;
          etherScanUrl = network.etherscan;
          const token = new MiniMeToken(web3, tokenAddress);

          const giverId = this.props.currentUser.giverId || '0';
          const { adminId } = this.props.model;

          const data = `0x${utils.padLeft(
            utils.toHex(giverId).substring(2),
            16,
          )}${utils.padLeft(utils.toHex(adminId).substring(2), 16)}`;

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
              <a
                href={`${etherScanUrl}tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
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
    confirmBlockchainTransaction(doDonate, () =>
      this.setState({ isSaving: false }),
    );
  }

  render() {
    // const { type, model, wallet } = this.props;
    // const {
    //   isSaving,
    //   amount,
    //   formIsValid,
    //   gasPrice,
    //   MEWurl,
    //   mewAmount,
    // } = this.state;
    // const style = {
    //   display: 'inline-block',
    // };

    return <div />;
    // return (
    //   <span style={style}>
    //     <button className="btn btn-success" onClick={this.openDialog}>
    //       Donate
    //     </button>
    //
    //     {wallet && (
    //       <SkyLightStateless
    //         isVisible={this.state.modalVisible}
    //         onCloseClicked={() => {
    //           this.setState({ modalVisible: false });
    //         }}
    //         onOverlayClicked={() => {
    //           this.setState({ modalVisible: false });
    //         }}
    //         title={`Support this ${type}!`}
    //       >
    //         <strong>
    //           Give Ether to support <em>{model.title}</em>
    //         </strong>
    //
    //         {['DAC', 'campaign'].indexOf(type) > -1 && (
    //           <p>
    //             Pledge: as long as the {type} owner does not lock your money you
    //             can take it back any time.
    //           </p>
    //         )}
    //
    //         {/*<p>*/}
    //           {/*Your wallet balance: <em>&#926;{wallet.getTokenBalance()}</em>*/}
    //           {/*<br />*/}
    //           {/*Gas price: <em>{utils.fromWei(gasPrice, 'gwei')} Gwei</em>*/}
    //         {/*</p>*/}
    //
    //         <Form
    //           onSubmit={this.submit}
    //           mapping={this.mapInputs}
    //           onValid={() => this.toggleFormValid(true)}
    //           onInvalid={() => this.toggleFormValid(false)}
    //           layout="vertical"
    //         >
    //           <div className="form-group">
    //             <Input
    //               name="amount"
    //               id="amount-input"
    //               label="How much Ξ do you want to donate?"
    //               type="number"
    //               value={amount}
    //               onChange={(name, value) =>
    //                 this.setState({ mewAmount: value })
    //               }
    //               placeholder="10"
    //               validations={{
    //                 // lessThan: wallet.getTokenBalance() - 0.5,
    //                 greaterThan: 0.00000000009,
    //               }}
    //               validationErrors={{
    //                 greaterThan: 'Minimum value must be at least Ξ0.1',
    //                 lessThan:
    //                   'This donation exceeds your Giveth wallet balance. Please top up your wallet or donate with MyEtherWallet.',
    //               }}
    //               required
    //               autoFocus
    //             />
    //           </div>
    //
    //           {/*<button*/}
    //             {/*className="btn btn-success"*/}
    //             {/*formNoValidate*/}
    //             {/*type="submit"*/}
    //             {/*disabled={isSaving || !formIsValid}*/}
    //           {/*>*/}
    //             {/*{isSaving ? 'Donating...' : 'Donate Ξ with Giveth'}*/}
    //           {/*</button>*/}
    //
    //           <a
    //             className={`btn btn-secondary ${isSaving ? 'disabled' : ''}`}
    //             disabled={isSaving}
    //             href={`${MEWurl}&value=${mewAmount}#send-transaction`}
    //             target="_blank"
    //             rel="noopener noreferrer"
    //           >
    //             Donate with MyEtherWallet
    //           </a>
    //         </Form>
    //       </SkyLightStateless>
    //     )}
    //   </span>
    // );
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
  wallet: PropTypes.instanceOf(BaseWallet),
};

DonateButton.defaultProps = {
  communityUrl: '',
  currentUser: undefined,
  wallet: undefined,
};
