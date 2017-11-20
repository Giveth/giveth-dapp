import React, { Component } from 'react';
import PropTypes from 'prop-types';

import BackupWallet from '../BackupWallet';
import { isAuthenticated } from '../../lib/middleware';
import currentUserModel from '../../models/currentUserModel';

/**
 * The Wallet view showing the wallet address and balance
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */

class UserWallet extends Component {
  componentWillMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet);
  }

  render() {
    return (
      <div id="profile-view" className="container-fluid page-layout">
        <center>
          <img className="empty-state-img" src={`${process.env.PUBLIC_URL}/img/wallet.svg`} width="200px" height="200px" alt="wallet-icon" />

          <h1>Your wallet</h1>

          {this.props.currentUser &&
            <div>
              <p>{this.props.currentUser.address}</p>
              <p> balance: &#926;{this.props.wallet.getBalance()}</p>
              <BackupWallet wallet={this.props.wallet} />
            </div>
          }
        </center>
      </div>
    );
  }
}

UserWallet.propTypes = {
  wallet: PropTypes.shape({
    keystores: PropTypes.arrayOf(PropTypes.shape({
      address: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      version: PropTypes.number.isRequired,
    })).isRequired,
    getBalance: PropTypes.func,
  }).isRequired,
  currentUser: currentUserModel,
  history: PropTypes.shape({}).isRequired,
};

UserWallet.defaultProps = {
  currentUser: undefined,
};

export default UserWallet;
