import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { history } from '../../lib/helpers';
import BackupWalletButton from '../BackupWalletButton';
import GivethWallet from '../../lib/blockchain/GivethWallet';

/**
 * The BackupWallet view shows backup button
 *
 * @param wallet       Wallet object with and all keystores
 */
const BackupWallet = props => (
  <div id="account-view" className="container-fluid page-layout">
    <div className="row">
      <div className="col-md-8 m-auto">
        <center>
          {props.wallet && (
            <div className="card bg-warning">
              <div>
                <center>
                  <h1>Back up your new Wallet!</h1>
                </center>

                <p>
                  We <strong>highly</strong> recommend that you download this backup file and keep
                  it in a safe place. If you lose this file or forget your wallet password, you will
                  not be able to access this account and all funds associated with it. Both this
                  file and your password are handled locally on your pc and in your browser: we
                  cannot help you recover anything, so please take a minute to do this now.
                </p>

                <BackupWalletButton
                  wallet={props.wallet}
                  onBackup={() => {
                    history.push('profile');
                  }}
                />
              </div>
            </div>
          )}
          {!props.wallet && (
            <div>
              <p>We could not find any Giveth wallet to backup</p>
              <Link className="btn btn-info" to="signup">
                Create new Wallet
              </Link>
            </div>
          )}
        </center>
      </div>
    </div>
  </div>
);

BackupWallet.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default BackupWallet;
