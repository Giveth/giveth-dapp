import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import { Link } from 'react-router-dom';

import GA from 'lib/GoogleAnalytics';
import getNetwork from '../lib/blockchain/getNetwork';
import User from '../models/User';
import { getGasPrice } from '../lib/helpers';
import GivethWallet from '../lib/blockchain/GivethWallet';
import { getHomeWeb3 } from '../lib/blockchain/getWeb3';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import DonationService from '../services/DonationService';

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
      this.setState({ givethBridge: network.givethBridge, etherscanUrl: network.homeEtherscan });
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
              [account] = accounts;

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

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  closeDialog() {
    this.setState({
      modalVisible: false,
      amount: '',
      formIsValid: false,
    });
  }

  openDialog() {
    this.setState({
      modalVisible: true,
      amount: '',
      formIsValid: false,
    });
  }

  submit(model) {
    // TODO how to handle k from non users
    // if (this.props.currentUser) {
    this.donateWithBridge(model);
    this.setState({ isSaving: true });
  }

  donateWithBridge(model) {
    const { currentUser } = this.props;
    const { adminId } = this.props.model;
    const { account, givethBridge, etherscanUrl } = this.state;

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

        GA.trackEvent({
          category: 'Donation',
          action: 'donated',
          label: `${etherscanUrl}tx/${txHash}`,
        });

        React.toast.info(
          <p>
            Awesome! Your donation is pending...
            <br />
            <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>,
        );
      })
      .then(() => {
        React.toast.success(
          <p>
            Woot! Woot! Donation received. You are awesome!
            <br />
            Note: because we are bridging networks, there will be a delay before your donation
            appears.
            <br />
            <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>,
        );
      })
      .catch(e => {
        if (!e.message.includes('User denied transaction signature')) {
          const err = !(e instanceof Error) ? JSON.stringify(e, null, 2) : e;
          ErrorPopup(
            'Something went wrong with your donation.',
            `${etherscanUrl}tx/${txHash} => ${err}`,
          );
        }
        this.setState({
          isSaving: false,
        });
      });
  }

  render() {
    const { model, currentUser, wallet, type } = this.props;
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
      modalVisible,
    } = this.state;
    const style = {
      display: 'inline-block',
    };

    // Determine max amount
    let maxAmount = 10000000000000000;
    if (homeWeb3) maxAmount = balance;
    if (
      this.props.maxAmount &&
      utils.toBN(this.props.maxAmount).lt(utils.toBN(utils.toWei(balance.toString())))
    )
      maxAmount = utils.fromWei(this.props.maxAmount);

    return (
      <span style={style}>
        <button type="button" className="btn btn-success" onClick={this.openDialog}>
          Donate
        </button>
        <Modal
          isOpen={modalVisible}
          onRequestClose={() => this.closeDialog()}
          contentLabel={`Support this ${type}!`}
          style={modalStyles}
        >
          <h3>
            Give Ether to support <em>{model.title}</em>
          </h3>

          {homeWeb3 &&
            !homeWeb3.givenProvider && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It is recommended that you install <a href="https://metamask.io/">MetaMask</a> to
                donate
              </div>
            )}

          {!wallet && (
            <div className="alert alert-warning">
              <i className="fa fa-exclamation-triangle" />
              We could not find your DApp wallet. If you want to maintain control over your donation
              please <Link to="/signin">sign in</Link> or <Link to="/signup">register</Link>.
            </div>
          )}

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
            account &&
            validNetwork && (
              <p>
                Pledge: as long as the {type} owner does not lock your money you can take it back
                any time.
              </p>
            )}

          {/* TODO add note that we are donating as the logged in user, or that they won't be able to manage funds if no logged in user & using metamask */}

          {homeWeb3 &&
            homeWeb3.givenProvider &&
            !account && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like your account is locked.
              </div>
            )}
          {homeWeb3 &&
            account &&
            validNetwork && (
              <p>
                {config.homeNetworkName} balance:{' '}
                <em>
                  &#926;
                  {balance}
                </em>
                <br />
                Gas price: <em>{gasPrice} Gwei</em>
              </p>
            )}
          <Form
            onSubmit={this.submit}
            mapping={inputs => ({ amount: inputs.amount })}
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
                placeholder="1"
                validations={{
                  lessOrEqualTo: maxAmount,
                  greaterThan: 0.009,
                }}
                validationErrors={{
                  greaterThan: 'Minimum value must be at least Ξ0.01',
                  lessOrEqualTo: `This donation exceeds your wallet balance or the milestone max amount: ${maxAmount} ETH.`,
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
        </Modal>
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
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(GivethWallet),
  maxAmount: PropTypes.string,
  type: PropTypes.string.isRequired,
};

DonateButton.defaultProps = {
  maxAmount: undefined,
  currentUser: undefined,
  wallet: undefined,
};

export default DonateButton;
