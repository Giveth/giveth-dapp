import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { utils } from 'web3';

import BackupWallet from '../BackupWallet';
import { isAuthenticated, takeActionAfterWalletUnlock } from '../../lib/middleware';
// import WithdrawButton from '../WithdrawButton';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import Loader from '../Loader';
import { feathersClient } from '../../lib/feathersClient';
import { getTruncatedText } from '../../lib/helpers';
import getNetwork from '../../lib/blockchain/getNetwork';

/**
 * The Wallet view showing the wallet address and balance
 *
 * @param currentUser  Currently logged in user information
 * @param wallet       Wallet object with the balance and all keystores
 */

class UserWallet extends Component {
  constructor() {
    super();

    this.state = {
      isLoadingWallet: true,
      isLoadingTokens: true,
      tokens: [],
      hasError: false,
      etherScanUrl: '',
      tokenAddress: '',
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
        tokenAddress: network.tokenAddress,
      });
    });
  }

  componentWillMount() {
    isAuthenticated(this.props.currentUser, this.props.wallet).then(() =>
      takeActionAfterWalletUnlock(this.props.wallet, () => {
        this.setState({ isLoadingWallet: false });

        // load tokens
        feathersClient
          .service('/tokens')
          .find({ query: { userAddress: this.props.currentUser.myAddress } })
          .then(resp => {
            this.setState(
              {
                tokens: resp.data,
                isLoadingTokens: false,
                hasError: false,
                tokenSymbols: resp.data.map(t => t.tokenSymbol),
              },
              this.getObjectsByTokenSymbol(),
            );
          })
          .catch(() => {
            this.setState({ hasError: true });
          });
      }),
    );
  }

  getObjectsByTokenSymbol() {
    // find the campaign and dac data for the token symbols
    Promise.all([
      new Promise((resolve, reject) => {
        feathersClient
          .service('dacs')
          .find({ tokenSymbol: { $in: this.state.tokenSymbols } })
          .then(res => resolve(res.data))
          .catch(() => reject());
      }),
      new Promise((resolve, reject) => {
        feathersClient
          .service('campaigns')
          .find({ tokenSymbol: { $in: this.state.tokenSymbols } })
          .then(res => resolve(res.data))
          .catch(() => reject());
      }),
    ])
      .then(([dacs, campaigns]) => {
        this.setState({
          tokens: this.state.tokens.map(t => {
            const matchingDac = dacs.find(d => d.tokenSymbol === t.tokenSymbol);
            const matchingCampaign = campaigns.find(c => c.tokenSymbol === t.tokenSymbol);

            t.meta = matchingDac || matchingCampaign;
            if (matchingDac) t.type = 'dac';
            else if (matchingCampaign) t.type = 'campaign';
            else t.type = 'removed';
            return t;
          }),
          isLoadingTokens: false,
          hasError: false,
        });
      })
      .catch(() => {
        this.setState({ isLoadingTokens: false, hasError: true });
      });
  }

  render() {
    const {
      isLoadingWallet,
      isLoadingTokens,
      tokens,
      hasError,
      etherScanUrl,
      tokenAddress,
    } = this.state;

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

          {!isLoadingWallet &&
            !hasError && (
              <div>
                <p>{this.props.currentUser.address}</p>
                <p> balance: {this.props.wallet.getBalance()} ETH</p>
                {etherScanUrl && (
                  <p>
                    <a
                      href={`${etherScanUrl}token/${tokenAddress}?a=${
                        this.props.currentUser.address
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GivETH
                    </a>{' '}
                    balance: {this.props.wallet.getTokenBalance()} ETH
                  </p>
                )}
                {!etherScanUrl && (
                  <p>GivETH balance: {this.props.wallet.getTokenBalance()} ETH</p>
                )}
                {/* <WithdrawButton wallet={this.props.wallet} currentUser={this.props.currentUser} /> */}
                <BackupWallet wallet={this.props.wallet} />

                {isLoadingTokens && <Loader className="small" />}

                {!isLoadingTokens &&
                  tokens.length > 0 && (
                    <div className="table-container">
                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            <th className="td-token-name">Token</th>
                            <th className="td-token-symbol">Symbol</th>
                            <th className="td-donations-amount">Amount</th>
                            <th className="td-tx-address">Token address</th>
                            <th className="td-name">Received from a donation to</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tokens.map(t => (
                            <tr key={t._id}>
                              <td className="td-token-name">{t.tokenName}</td>
                              <td className="td-token-symbol">{t.tokenSymbol}</td>
                              <td className="td-donations-amount">
                                {t.balance ? utils.fromWei(t.balance) : 0}
                              </td>
                              <td className="td-tx-address">
                                {etherScanUrl && (
                                  <a href={`${etherScanUrl}address/${t.tokenAddress}`}>
                                    {t.tokenAddress}
                                  </a>
                                )}
                                {!etherScanUrl && <span>{t.tokenAddress}</span>}
                              </td>
                              <td className="td-received-from">
                                {t.type === 'campaign' && (
                                  <Link to={`/campaigns/${t.meta._id}`}>
                                    <em>{t.type} </em>
                                    {getTruncatedText(t.meta.title, 45)}
                                  </Link>
                                )}
                                {t.type === 'dac' && (
                                  <Link to={`/dacs/${t.meta._id}`}>
                                    <em>{t.type} </em>
                                    {getTruncatedText(t.meta.title, 45)}
                                  </Link>
                                )}
                                {t.type === 'revomed' && <span>Does not exist anymore</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            )}

          {!isLoadingWallet &&
            hasError && (
              <div>
                <h1>
                  Oops, something went wrong loading your wallet. Please refresh the page to try
                  again
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
