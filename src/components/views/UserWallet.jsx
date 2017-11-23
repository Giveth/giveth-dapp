import React, { Component } from 'react';
import PropTypes from 'prop-types';

import BackupWallet from '../BackupWallet';
import { isAuthenticated, takeActionAfterWalletUnlock } from '../../lib/middleware';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import Loader from '../Loader';
import { feathersClient } from '../../lib/feathersClient';

/**
 * The Wallet view showing the wallet address and balance
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */

class UserWallet extends Component {
  constructor(){
    super();

    this.state = {
      isLoadingWallet: true,
      isLoadingTokens: true,
      tokens: [],
      hasError: false
    }
  }

  componentWillMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet)
      .then(() => takeActionAfterWalletUnlock(this.props.wallet, () => {
        this.setState({ isLoadingWallet: false })

        // load tokens
        feathersClient.service('/tokens').find()
          .then((resp) => {
            console.log('tokens', resp)
            this.setState({
              tokens: resp,
              isLoadingTokens: false,
              hasError: false
            })
          })
          .catch((e) => {
            console.error('could not load tokens');
            this.setState({ hasError: true })
          })
      })
    );
  }

  render() {
    const { isLoadingWallet, isLoadingTokens, tokens, hasError } = this.state;

    return (
      <div id="profile-view" className="container-fluid page-layout">
        <center>
          <img className="empty-state-img" src={`${process.env.PUBLIC_URL}/img/wallet.svg`} width="200px" height="200px" alt="wallet-icon" />

          <h1>Your wallet</h1>

          { isLoadingWallet &&
            <Loader className="fixed" />
          }          

          { !isLoadingWallet && !hasError &&
            <div>
              <p>{this.props.currentUser.address}</p>
              <p> balance: &#926;{this.props.wallet.getBalance()}</p>
              <BackupWallet wallet={this.props.wallet} />
            </div>
          }

          { !isLoadingWallet && hasError &&
            <div>
              <h1>Oops, something went wrong loading your wallet. Please refresh the page to try again</h1>
            </div>
          }
        </center>
      </div>
    );
  }
}

UserWallet.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
  history: PropTypes.shape({}).isRequired,
};

export default UserWallet;
