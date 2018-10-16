import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import { Link } from 'react-router-dom';
import Toggle from 'react-toggle';

import GA from 'lib/GoogleAnalytics';
import Slider from 'react-rangeslider';
import getNetwork from '../lib/blockchain/getNetwork';
import 'react-rangeslider/lib/index.css';
import User from '../models/User';
import { getGasPrice } from '../lib/helpers';
import { getHomeWeb3 } from '../lib/blockchain/getWeb3';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import DonationService from '../services/DonationService';
import { feathersClient } from '../lib/feathersClient';

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
  constructor(props) {
    super(props);

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
      showCustomAddress: false,
      customAddress:
        props.currentUser && props.currentUser.address ? props.currentUser.address : undefined,
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
    this.donateWithBridge(model);
    this.setState({ isSaving: true });
  }

  async donateWithBridge(model) {
    const { currentUser } = this.props;
    const { adminId } = this.props.model;
    const { account, givethBridge, etherscanUrl, showCustomAddress } = this.state;

    const value = utils.toWei(model.amount);

    const opts = { value, gas: DONATION_GAS, from: account };
    let method;
    let donationUser;

    if (showCustomAddress) {
      // Donating on behalf of another user or address
      try {
        const user = await feathersClient.service('users').get(model.customAddress);
        if (user && user.giverId > 0) {
          method = givethBridge.donate(user.giverId, adminId, opts);
          donationUser = user;
        } else {
          givethBridge.donateAndCreateGiver(model.customAddress, adminId, opts);
          donationUser = { address: model.customAddress };
        }
      } catch (e) {
        givethBridge.donateAndCreateGiver(model.customAddress, adminId, opts);
        donationUser = { address: model.customAddress };
      }
    } else if (currentUser) {
      // Donating on behalf of logged in DApp user
      method =
        currentUser.giverId > 0
          ? givethBridge.donate(currentUser.giverId, adminId, opts)
          : givethBridge.donateAndCreateGiver(currentUser.address, adminId, opts);
      donationUser = currentUser;
    } else {
      // Donating without any user
      method = givethBridge.donateAndCreateGiver(account, adminId, opts);
      donationUser = { address: account };
    }

    let txHash;
    method
      .on('transactionHash', async transactionHash => {
        txHash = transactionHash;
        this.closeDialog();
        await DonationService.newFeathersDonation(donationUser, this.props.model, value, txHash);

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
    const { model, currentUser, type } = this.props;
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
      customAddress,
      showCustomAddress,
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

          {homeWeb3 &&
            homeWeb3.givenProvider &&
            !validNetwork && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like you are connected to the wrong network on your MetaMask. Please
                connect to the <strong>{config.homeNetworkName}</strong> network to donate
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

          {homeWeb3 &&
            homeWeb3.givenProvider &&
            !account && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like your MetaMask account is locked.
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
            mapping={inputs => ({ amount: inputs.amount, customAddress: inputs.customAddress })}
            onValid={() => this.toggleFormValid(true)}
            onInvalid={() => this.toggleFormValid(false)}
            layout="vertical"
          >
            <span className="label">How much Ξ do you want to donate?</span>
            <div className="form-group">
              <Slider
                type="range"
                name="amount2"
                min={0}
                max={parseInt(maxAmount * 100, 10) / 100}
                step={0.01}
                value={Number(this.state.amount).toFixed(2)}
                labels={{
                  0: '0',
                  [maxAmount]: parseInt(maxAmount * 100, 10) / 100,
                }}
                format={val => `${val} ETH`}
                onChange={newAmount => this.setState({ amount: Number(newAmount).toFixed(2) })}
              />
            </div>

            <div className="form-group">
              <Input
                name="amount"
                id="amount-input"
                type="number"
                step="any"
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
                autoFocus
              />
            </div>

            {!(currentUser && currentUser.address) &&
              !showCustomAddress && (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle" />
                  We could not find your DApp wallet. If you want to maintain control over your
                  donation please <Link to="/signin">sign in</Link> or{' '}
                  <Link to="/signup">register</Link>.
                </div>
              )}

            {currentUser &&
              currentUser.address &&
              !showCustomAddress && (
                <div className="alert alert-success">
                  <i className="fa fa-exclamation-triangle" />
                  We detected that you have a DApp wallet. The donation will be donated on behalf of
                  your DApp account:{' '}
                  <Link to={`/profile/${currentUser.address}`}>
                    {currentUser.name ? currentUser.name : currentUser.address}
                  </Link>{' '}
                  so that you can see your donation in My Donations page.
                </div>
              )}
            {showCustomAddress && (
              <div className="alert alert-success">
                <i className="fa fa-exclamation-triangle" />
                The donation will be donated on behalf of address:
              </div>
            )}

            <div className="react-toggle-container">
              <Toggle
                id="show-recipient-address"
                defaultChecked={showCustomAddress}
                onChange={() =>
                  this.setState(prevState => ({
                    showCustomAddress: !prevState.showCustomAddress,
                  }))
                }
              />
              <div className="label">I want to donate on behalf of another address</div>
            </div>
            {showCustomAddress && (
              <div className="form-group recipient-address-container">
                <Input
                  name="customAddress"
                  id="title-input"
                  type="text"
                  value={customAddress}
                  placeholder="0x0000000000000000000000000000000000000000"
                  validations="isEtherAddress"
                  validationErrors={{
                    isEtherAddress: 'Please insert a valid Ethereum address.',
                  }}
                  required={this.state.showRecipientAddress}
                />
              </div>
            )}
            {!showCustomAddress && (
              <div>
                <br />
                <br />
              </div>
            )}

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
  maxAmount: PropTypes.string,
  type: PropTypes.string.isRequired,
};

DonateButton.defaultProps = {
  maxAmount: undefined,
  currentUser: undefined,
};

export default DonateButton;
