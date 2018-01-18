import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Loader from './Loader';
import BaseWallet from '../lib/blockchain/BaseWallet';

/* global URL, Blob */
/**
 * BackupWallet lets users download backup file of their wallet.
 *
 * @param wallet    Wallet object with the balance and all keystores
 * @param onBackup  Callback function when the 'Download backup' is clicked
 */

class BackupWallet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      keystore: props.wallet.keystores[0],
      isLoading: false,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.props.onBackup) {
      this.props.onBackup();
    }
  }

  render() {
    const { isLoading, keystore } = this.state;

    return (
      <span>
        {isLoading && (
          <div>
            <Loader />
            Loading wallet...
          </div>
        )}

        {!isLoading && (
          <a
            className="btn btn-success"
            onClick={this.handleClick}
            href={URL.createObjectURL(
              new Blob([JSON.stringify(keystore)], {
                type: 'application/json',
              }),
            )}
            download={`UTC--${new Date().toISOString()}-${
              keystore.address
            }.json`}
          >
            Download Backup File
          </a>
        )}
      </span>
    );
  }
}

BackupWallet.propTypes = {
  wallet: PropTypes.instanceOf(BaseWallet).isRequired,
  onBackup: PropTypes.func,
};

BackupWallet.defaultProps = {
  onBackup: () => {},
};

export default BackupWallet;
