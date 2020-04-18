import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { Form } from 'formsy-react-components';
import getWeb3 from '../lib/blockchain/getWeb3';
import * as fundForwarder from '../lib/blockchain/fundsForwarder';
import User from '../models/User';
import LoaderButton from './LoaderButton';
import CampaignService from '../services/CampaignService';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import ViewNetworkWarning from './ViewNetworkWarning';
import ActionNetworkWarning from './ActionNetworkWarning';
import { authenticateIfPossible, checkProfile, sleep } from '../lib/middleware';
import { history } from '../lib/helpers';

const newFundForwarderEventName = 'NewFundForwarder';
const zeroAddress = '0x0000000000000000000000000000000000000000';
const erc20TokensBridgeAllowed = {
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359': 'SAI',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
};
const tokenSymbols = {
  [zeroAddress]: 'ETH',
  ...erc20TokensBridgeAllowed,
};

/* eslint-disable no-console */

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

function getNewFundForwarderAddressFromTx(tx) {
  const { events } = tx;
  const newFundForwarderEvent = events[newFundForwarderEventName];
  // Early return with empty address
  if (!newFundForwarderEvent || !newFundForwarderEvent.returnValues) return '';
  return newFundForwarderEvent.returnValues.fundsForwarder;
}

class CreateDonationAddressButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalVisible: false,
      fetchingExistingAddress: false,
      fetchingBalances: false,
      donationAddress: '',
      balances: {},
    };

    this.openDialog = this.openDialog.bind(this);
    this.deployFundsForwarder = this.deployFundsForwarder.bind(this);
    this.findExistingDonationAddress = this.findExistingDonationAddress.bind(this);
    this.fetchDonationAddressBalances = this.fetchDonationAddressBalances.bind(this);
    this.fordwardBalance = this.fordwardBalance.bind(this);
  }

  componentDidMount() {
    this.findExistingDonationAddress();
  }

  async setAddressAndFetch(address) {
    this.setState({ donationAddress: address });
    this.fetchDonationAddressBalances();
    this.stopLoadingDonationAddress();
  }

  checkUser() {
    if (!this.props.currentUser) {
      history.push('/');
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, true).then(() =>
      checkProfile(this.props.currentUser),
    );
  }

  async stopLoadingDonationAddress() {
    this.setState({ fetchingExistingAddress: false });
  }

  async findExistingDonationAddress() {
    try {
      const { campaignId } = this.props;
      CampaignService.get(campaignId).then(async campaign => {
        if (campaign.fundsForwarder && campaign.fundsForwarder !== '0x0') {
          this.setAddressAndFetch(campaign.fundsForwarder);
        } else {
          this.setState({ fetchingExistingAddress: true });
          this.stopLoadingDonationAddress();
        }
      });
    } catch (e) {
      console.error(`Error checking for existing donation address: ${e.stack}`);
      this.stopLoadingDonationAddress();
    }
  }

  async fetchDonationAddressBalances() {
    try {
      this.setState({ fetchingBalances: true });
      const { donationAddress } = this.state;
      const web3 = await getWeb3();

      const fetchedBalances = {};
      await Promise.all(
        Object.keys(tokenSymbols).map(async tokenAddress => {
          try {
            let balanceWei;
            if (tokenAddress === zeroAddress) {
              // ETH Balance
              balanceWei = await web3.eth.getBalance(donationAddress);
            } else {
              // ERC20 Token
              const erc20 = new web3.eth.Contract(fundForwarder.erc20Abi, tokenAddress);
              balanceWei = await erc20.methods.balanceOf(donationAddress).call();
            }
            // Balance to forward MUST be > 0, otherwise
            // VM Exception while processing transaction: revert ERROR_BRIDGE_CALL -- Reason given: ERROR_BRIDGE_CALL
            // GivethBridge.sol 197: require(amount > 0);
            if (balanceWei > 0) fetchedBalances[tokenAddress] = web3.utils.fromWei(balanceWei);
          } catch (e) {
            console.error(`Error fetching token balance of ${tokenAddress}: ${e.etack}`);
          }
        }),
      );

      this.setState(prevState => ({
        balances: {
          ...prevState.balances,
          ...fetchedBalances,
        },
      }));
    } catch (e) {
      console.error(`Error fetching donation address balances: ${e.stack}`);
    } finally {
      this.setState({ fetchingBalances: false });
    }
  }

  /**
   * Calls forward(address)
   * @param {string} addressToForward "0x00000000" for ETH, "0xab3123a" for a token
   */
  async fordwardBalance(addressToForward) {
    try {
      const web3 = await getWeb3();
      const { currentUser } = this.props;
      const { donationAddress, balances } = this.state;
      const { homeEtherscan: etherscanUrl } = config;
      const from = currentUser.address;
      if (!balances[addressToForward]) throw Error('No balance to forward');

      const fundsForwarder = new web3.eth.Contract(fundForwarder.abi, donationAddress);

      const tx = fundsForwarder.methods.forward(addressToForward).send({ from });

      let txHash;
      await tx
        .on('transactionHash', async _txHash => {
          txHash = _txHash;
          React.toast.info(
            <p>
              Forwarding balances to the bridge...
              <br />
              <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
          this.closeDialog();
        })
        .then(async () => {
          React.toast.success(
            <p>
              Balances successfully forwarded to the bridge
              <br />
              <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
          await sleep(3000);
          window.location.reload();
        })
        .catch(e => {
          /* eslint-disable-next-line no-console */
          console.error(e); // Why not? console.error is great for web debugging
          if (!e.message.includes('User denied transaction signature')) {
            const err = !(e instanceof Error) ? JSON.stringify(e, null, 2) : e;
            ErrorPopup(
              'Something went wrong with the transaction',
              `${etherscanUrl}tx/${txHash} => ${err}`,
            );
          } else {
            React.toast.info('The transaction was cancelled');
          }
        });
    } catch (e) {
      console.error(`Error forwarding balances: ${e.stack}`);
    } finally {
      //
    }
  }

  closeDialog() {
    this.setState({ modalVisible: false });
  }

  openDialog() {
    const { donationAddress } = this.state;
    this.setState({ modalVisible: true });
    if (donationAddress !== '') {
      return;
    }
    this.checkUser()
      .then(() => {})
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  async deployFundsForwarder() {
    const { currentUser, receiverId, giverId, campaignId } = this.props;
    const { fundsForwarderFactoryAddress, homeEtherscan: etherscanUrl } = config;
    const web3 = await getWeb3();
    const from = currentUser.address;

    /* eslint-disable-next-line no-console */
    // console.log('Deploying funds forwarder', { giverId, receiverId, from });

    const fundsForwarderFactory = new web3.eth.Contract(
      fundForwarder.factoryAbi,
      fundsForwarderFactoryAddress,
    );

    let txHash;
    /**
     * Deploys a new funds forwarder
     *
     * @param {number} _giverId
     * @param {number} _receiverId
     */
    const tx = fundsForwarderFactory.methods.newFundsForwarder(giverId, receiverId).send({ from });

    tx.on('transactionHash', async _txHash => {
      txHash = _txHash;
      React.toast.info(
        <p>
          Creating donation address...
          <br />
          <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>,
      );
      this.closeDialog();
    })
      .then(receipt => {
        const newDonationAddress = getNewFundForwarderAddressFromTx(receipt);
        CampaignService.addFundsForwarderAddress(campaignId, newDonationAddress);
        React.toast.success(
          <p>
            Donation address successfully created
            <br />
            {newDonationAddress ? (
              <a
                href={`${etherscanUrl}address/${newDonationAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View address {newDonationAddress}
              </a>
            ) : (
              <a href={`${etherscanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            )}
          </p>,
        );
      })
      .catch(e => {
        /* eslint-disable-next-line no-console */
        console.error(e); // Why not? console.error is great for web debugging
        if (!e.message.includes('User denied transaction signature')) {
          const err = !(e instanceof Error) ? JSON.stringify(e, null, 2) : e;
          ErrorPopup(
            'Something went wrong with the transaction',
            `${etherscanUrl}tx/${txHash} => ${err}`,
          );
        } else {
          React.toast.info('The transaction was cancelled');
        }
      });
  }

  render() {
    const { homeEtherscan: etherscanUrl } = config;
    const {
      campaignTitle,
      campaignOwner,
      currentUser,
      isEnabled,
      validProvider,
      isCorrectNetwork,
      enableProvider,
    } = this.props;
    const {
      modalVisible,
      fetchingExistingAddress,
      fetchingBalances,
      donationAddress,
      balances,
    } = this.state;

    const buttonText = donationAddress ? 'View donation address' : 'Create donation address';
    const loadingText = 'Loading donation addrs';

    const balancesPretty = Object.entries(balances).map(([tokenAddress, balance]) => ({
      symbol: tokenSymbols[tokenAddress] || `??? ${tokenAddress}`,
      balance,
      tokenAddress,
    }));

    return (
      <span
        style={{
          // NOTE: Hard-coded here for a lack of a better place
          marginLeft: '10px',
          display: 'inline-block',
        }}
      >
        {!donationAddress && campaignOwner && currentUser && campaignOwner === currentUser.address && (
          <LoaderButton
            className="btn btn-warning"
            isLoading={fetchingExistingAddress}
            disabled={fetchingExistingAddress}
            loadingText={loadingText}
            onClick={() => {
              if (!isEnabled) enableProvider();
              else this.openDialog();
            }}
          >
            Create donation address
          </LoaderButton>
        )}
        {donationAddress && (
          <LoaderButton
            className="btn btn-warning"
            isLoading={fetchingExistingAddress}
            disabled={fetchingExistingAddress}
            loadingText={loadingText}
            onClick={() => {
              if (!isEnabled) enableProvider();
              else this.openDialog();
            }}
          >
            View donation address
          </LoaderButton>
        )}

        {donationAddress ? (
          // Modal for viewing the donation address
          <Modal
            isOpen={modalVisible}
            onRequestClose={() => this.closeDialog()}
            shouldCloseOnOverlayClick={false}
            style={modalStyles}
          >
            <Form onSubmit={this.deployFundsForwarder}>
              <h3>
                View the donation address for <em>{campaignTitle}</em>
              </h3>

              <p>Donation address for this campaign</p>
              <p>
                <span>
                  <a
                    href={`${etherscanUrl}address/${donationAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {donationAddress}
                  </a>
                </span>
              </p>

              {/* I have to write this ugly code because of eslint(no-nested-ternary) */}
              {fetchingBalances && <p>Fetching balances in donation address...</p>}
              {!fetchingBalances && balancesPretty.length > 0 && (
                <p>Balances in donation address</p>
              )}
              {!fetchingBalances && balancesPretty.length === 0 && (
                <p>No balances in donation address</p>
              )}

              <table>
                {balancesPretty.map(({ symbol, balance, tokenAddress }) => (
                  <tr key={symbol}>
                    <td style={{ textAlign: 'right' }}>{balance}</td>
                    <td style={{ padding: '0 16px 0 8px' }}>{symbol}</td>
                    <td style={{ padding: '8px 0' }}>
                      {isCorrectNetwork && validProvider && currentUser && (
                        <LoaderButton
                          className="btn btn-success"
                          disabled={!isCorrectNetwork}
                          isLoading={false}
                          onClick={() => this.fordwardBalance(tokenAddress)}
                          loadingText="Forwarding balances..."
                          style={{ padding: '2px 10px' }}
                        >
                          Forward balance
                        </LoaderButton>
                      )}
                    </td>
                  </tr>
                ))}
              </table>

              {balancesPretty.length > 0 && (
                <Fragment>
                  {!validProvider && (
                    <div className="alert alert-warning">
                      <i className="fa fa-exclamation-triangle" />
                      Please install <a href="https://metamask.io/">MetaMask</a> to donate
                    </div>
                  )}

                  {validProvider && currentUser && (
                    <ViewNetworkWarning
                      incorrectNetwork={!isCorrectNetwork}
                      networkName={config.homeNetworkName}
                    />
                  )}

                  {validProvider && !currentUser && (
                    <div className="alert alert-warning">
                      <i className="fa fa-exclamation-triangle" />
                      It looks like your Ethereum Provider is locked or you need to enable it.
                    </div>
                  )}

                  {/* Buttons show up above when metamask and network is correct */}
                  {/* {isCorrectNetwork && validProvider && currentUser && ()} */}
                </Fragment>
              )}

              <button
                className="btn btn-light float-right"
                type="button"
                onClick={() => {
                  this.setState({ modalVisible: false });
                }}
              >
                Close
              </button>
            </Form>
          </Modal>
        ) : (
          // Modal for creating the donation address
          <Modal
            isOpen={modalVisible}
            onRequestClose={() => this.closeDialog()}
            shouldCloseOnOverlayClick={false}
            style={modalStyles}
          >
            <Form onSubmit={this.deployFundsForwarder}>
              <h3>
                Create a donation address for <em>{campaignTitle}</em>
              </h3>

              {!validProvider && (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle" />
                  Please install <a href="https://metamask.io/">MetaMask</a> to donate
                </div>
              )}

              {validProvider && currentUser && (
                <ActionNetworkWarning
                  incorrectNetwork={!isCorrectNetwork}
                  networkName={config.homeNetworkName}
                />
              )}
              {isCorrectNetwork && currentUser && (
                <p>
                  <span>
                    You will create a donation address for this campaing by deploying a funds
                    forwarder contract. This means that anyone can transfer ETH or approved tokens
                    to the resulting address and those funds will automatically be donated to this
                    specific campaign. This functionality is appropiate for DAOs (i.e. Aragon,
                    Moloch) and for users who cannot execute contract calls.
                  </span>
                </p>
              )}

              {validProvider && !currentUser && (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle" />
                  It looks like your Ethereum Provider is locked or you need to enable it.
                </div>
              )}

              <br />

              {isCorrectNetwork && validProvider && currentUser && (
                <LoaderButton
                  className="btn btn-success"
                  type="submit"
                  disabled={!isCorrectNetwork}
                  isLoading={false}
                  loadingText="Donating..."
                >
                  {buttonText}
                </LoaderButton>
              )}

              <button
                className="btn btn-light float-right"
                type="button"
                onClick={() => {
                  this.setState({ modalVisible: false });
                }}
              >
                Close
              </button>
            </Form>
          </Modal>
        )}
      </span>
    );
  }
}

CreateDonationAddressButton.propTypes = {
  campaignTitle: PropTypes.string.isRequired,
  campaignOwner: PropTypes.string.isRequired,
  campaignId: PropTypes.string.isRequired,
  receiverId: PropTypes.number.isRequired,
  giverId: PropTypes.number.isRequired,
  currentUser: PropTypes.instanceOf(User),
  validProvider: PropTypes.bool.isRequired,
  isEnabled: PropTypes.bool.isRequired,
  enableProvider: PropTypes.func.isRequired,
  isCorrectNetwork: PropTypes.bool.isRequired,
};

CreateDonationAddressButton.defaultProps = {
  currentUser: undefined,
};

export default props => (
  <Web3Consumer>
    {({ state: { isHomeNetwork, isEnabled, validProvider }, actions: { enableProvider } }) => (
      <CreateDonationAddressButton
        validProvider={validProvider}
        isCorrectNetwork={isHomeNetwork}
        isEnabled={isEnabled}
        enableProvider={enableProvider}
        {...props}
      />
    )}
  </Web3Consumer>
);
