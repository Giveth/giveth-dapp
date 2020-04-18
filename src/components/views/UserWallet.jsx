import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GA from 'lib/GoogleAnalytics';
import BackupWalletButton from '../BackupWalletButton';
import { isLoggedIn } from '../../lib/middleware';
// import WithdrawButton from '../WithdrawButton';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import Loader from '../Loader';
import config from '../../configuration';
import BridgeWithdrawButton from '../BridgeWithdrawButton';
import ErrorPopup from '../ErrorPopup';

// TODO: Remove the eslint exception after extracting to model
/* eslint no-underscore-dangle: 0 */

/**
 * The Wallet view showing the wallet address and balance
 *
 * @param currentUser  Currently logged in user information
 * @param wallet       Wallet object with the balance and all keystores
 */

class UserWallet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingWallet: true,
      insufficientBalance: false,
      hasError: false,
    };
  }

  componentDidMount() {
    isLoggedIn(this.props.currentUser)
      .then(() => {
        const bal = this.props.wallet.getBalance();
        const insufficientBalance = bal === undefined || bal < React.minimumWalletBalance;
        this.setState({ isLoadingWallet: false, insufficientBalance });
      })
      .catch(err => {
        if (err === 'notLoggedIn') {
          ErrorPopup('You are not logged in.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  /* eslint-disable class-methods-use-this */
  onBackup() {
    GA.trackEvent({
      category: 'User',
      action: 'backed up wallet',
    });
  }

  hasTokenBalance() {
    return Object.values(config.tokenAddresses).some(a => this.props.wallet.getTokenBalance(a) > 0);
  }

  render() {
    const { isLoadingWallet, insufficientBalance, hasError } = this.state;
    const { etherscan, tokenAddresses } = config;

    return (
      <div id="profile-view" className="container-fluid page-layout dashboard-table-view">
        <center>
          <img
            className="empty-state-img"
            src={`${process.env.PUBLIC_URL}/img/wallet.svg`}
            width="200px"
            height="200px"
            alt="wallet-icon"
          />

          <h1>Your wallet</h1>

          {isLoadingWallet && <Loader className="fixed" />}

          {!isLoadingWallet && !hasError && (
            <div>
              <div className="alert alert-warning">
                <i className="fa fa-exclamation-triangle" />
                Please <strong>do not send any main network ether</strong> to this address. All the
                transactions in the DApp are made on <strong>{config.foreignNetworkName}</strong>{' '}
                network. To interact with the DApp you do not need any main network ether.
              </div>
              <p>
                <a
                  href={`${config.etherscan}/address/${this.props.currentUser.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {this.props.currentUser.address}
                </a>
              </p>

              {insufficientBalance && (
                <div className="alert alert-warning">
                  <p>
                    We noticed that you do not have a sufficient balance in your wallet. Your wallet
                    should be automatically topped up, however if you are a frequent user or use
                    this wallet on the <strong>{config.foreignNetworkName}</strong> network, we may
                    not be able to replenish it fast enough.
                  </p>
                  <p>
                    <strong>{config.foreignNetworkName}</strong> balance:{' '}
                    {this.props.wallet.getBalance()} ETH
                  </p>
                  <p>
                    You can visit the{' '}
                    <a href="https://faucet.rinkeby.io/" target="_blank" rel="noopener noreferrer">
                      faucet
                    </a>{' '}
                    to get more ETH
                  </p>
                </div>
              )}

              <p>
                <BackupWalletButton wallet={this.props.wallet} onBackup={this.onBackup} />
              </p>

              {this.hasTokenBalance() && (
                <div>
                  {Object.keys(tokenAddresses)
                    .filter(t => this.props.wallet.getTokenBalance(tokenAddresses[t]) > 0)
                    .map(t =>
                      etherscan ? (
                        <p>
                          <a
                            href={`${etherscan}token/${tokenAddresses[t]}?a=${this.props.currentUser.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <strong>Bridged -{t}</strong>
                          </a>
                          balance: {this.props.wallet.getTokenBalance(tokenAddresses[t])}
                        </p>
                      ) : (
                        <p>
                          Bridged - <strong>{t}</strong> balance:{' '}
                          {this.props.wallet.getTokenBalance(tokenAddresses[t])}
                        </p>
                      ),
                    )}
                  <div className="alert alert-warning">
                    We noticed you have some tokens on the{' '}
                    <strong>{config.foreignNetworkName}</strong> network that have not been
                    transfered across the bridge to the
                    <strong>{config.homeNetworkName}</strong> network.
                  </div>
                  <BridgeWithdrawButton
                    wallet={this.props.wallet}
                    currentUser={this.props.currentUser}
                  />
                </div>
              )}
              {/* <WithdrawButton wallet={this.props.wallet} currentUser={this.props.currentUser} /> */}
            </div>
          )}

          {!isLoadingWallet && hasError && (
            <div>
              <h1>
                Oops, something went wrong loading your wallet. Please refresh the page to try again
              </h1>
            </div>
          )}
        </center>
      </div>
    );
  }
}

UserWallet.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
};

export default UserWallet;
