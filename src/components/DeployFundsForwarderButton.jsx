import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { Form } from 'formsy-react-components';
import getWeb3 from '../lib/blockchain/getWeb3';
import * as fundForwarder from '../lib/blockchain/fundsForwarder';
import User from '../models/User';
import LoaderButton from './LoaderButton';
import ErrorPopup from './ErrorPopup';
import config from '../configuration';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import NetworkWarning from './NetworkWarning';

const buttonText = 'Create donation address';
const newFundForwarderEventName = 'NewFundForwarder';

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

class DeployFundsForwarderButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalVisible: false,
    };

    this.openDialog = this.openDialog.bind(this);
    this.deployFundsForwarder = this.deployFundsForwarder.bind(this);
  }

  closeDialog() {
    this.setState({ modalVisible: false });
  }

  openDialog() {
    this.setState({ modalVisible: true });
  }

  async deployFundsForwarder() {
    const { currentUser, receiverId, giverId } = this.props;
    const { fundsForwarderFactoryAddress, homeEtherscan: etherscanUrl } = config;
    const web3 = await getWeb3();
    const from = currentUser.address;

    /* eslint-disable-next-line no-console */
    console.log('Deploying funds forwarder', { giverId, receiverId, from });

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
    const {
      campaignTitle,
      currentUser,
      isEnabled,
      validProvider,
      isCorrectNetwork,
      enableProvider,
    } = this.props;
    const { modalVisible } = this.state;

    return (
      <span
        style={{
          // NOTE: Hard-coded here for a lack of a better place
          marginLeft: '10px',
          display: 'inline-block',
        }}
      >
        <button
          type="button"
          className="btn btn-warning"
          onClick={() => {
            if (!isEnabled) enableProvider();
            else this.openDialog();
          }}
        >
          {buttonText}
        </button>
        <Modal
          isOpen={modalVisible}
          onRequestClose={() => this.closeDialog()}
          shouldCloseOnOverlayClick={false}
          contentLabel="Support this THING!"
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

            {validProvider && (
              <NetworkWarning
                incorrectNetwork={!isCorrectNetwork}
                networkName={config.homeNetworkName}
              />
            )}
            {isCorrectNetwork && currentUser && (
              <p>
                <span>
                  You will create a donation address for this campaing by deploying a funds
                  forwarder contract. This means that anyone can transfer ETH or approved tokens to
                  the resulting address and those funds will automatically be donated to this
                  specific campaign. This functionality is appropiate for DAOs (i.e. Aragon, Moloch)
                  and for users who cannot execute contract calls.
                </span>
              </p>
            )}

            {validProvider && !currentUser && (
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                It looks like your Ethereum Provider is locked or you need to enable it.
              </div>
            )}

            {isCorrectNetwork && validProvider && currentUser && (
              <React.Fragment>
                <div>
                  <br />
                </div>

                {
                  <LoaderButton
                    className="btn btn-success"
                    type="submit"
                    disabled={!isCorrectNetwork}
                    isLoading={false}
                    loadingText="Donating..."
                  >
                    {buttonText}
                  </LoaderButton>
                }
              </React.Fragment>
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
      </span>
    );
  }
}

DeployFundsForwarderButton.propTypes = {
  campaignTitle: PropTypes.string.isRequired,
  receiverId: PropTypes.number.isRequired,
  giverId: PropTypes.number.isRequired,
  currentUser: PropTypes.instanceOf(User),
  validProvider: PropTypes.bool.isRequired,
  isEnabled: PropTypes.bool.isRequired,
  enableProvider: PropTypes.func.isRequired,
  isCorrectNetwork: PropTypes.bool.isRequired,
};

DeployFundsForwarderButton.defaultProps = {
  currentUser: undefined,
};

export default props => (
  <Web3Consumer>
    {({ state: { isHomeNetwork, isEnabled, validProvider }, actions: { enableProvider } }) => (
      <DeployFundsForwarderButton
        validProvider={validProvider}
        isCorrectNetwork={isHomeNetwork}
        isEnabled={isEnabled}
        enableProvider={enableProvider}
        {...props}
      />
    )}
  </Web3Consumer>
);
