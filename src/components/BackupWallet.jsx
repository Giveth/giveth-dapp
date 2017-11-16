import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Loader from './Loader';

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
      <div>
        {isLoading &&
          <div>
            <Loader />
            Loading wallet...
          </div>
        }

        {!isLoading &&
          <a
            className="btn btn-success"
            onClick={this.handleClick}
            href={URL.createObjectURL(new Blob([JSON.stringify(keystore)], { type: 'application/json' }))}
            download={`givethKeystore-${Date.now()}.json`}
          >
            Download Backup File
          </a>
        }
      </div>
    );
  }
}

BackupWallet.propTypes = {
  wallet: PropTypes.shape({
    keystores: PropTypes.arrayOf(PropTypes.shape({
      address: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      version: PropTypes.number.isRequired,
    })).isRequired,
  }).isRequired,
  onBackup: PropTypes.func.isRequired,
};

export default BackupWallet;
