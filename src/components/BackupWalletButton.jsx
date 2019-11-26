import React from 'react';
import PropTypes from 'prop-types';

import GivethWallet from '../lib/blockchain/GivethWallet';

/**
 * BackupWallet lets users download backup file of their wallet.
 *
 * @param wallet    Wallet object with the balance and all keystores
 * @param onBackup  Callback function when the 'Download backup' is clicked
 */

const BackupWalletButton = ({ wallet, onBackup }) => (
  <span>
    {/*! (wallet && Array.isArray(wallet.keystores) && wallet.keystores.length > 0) && (
      // No wallet found
    ) */}

    {wallet && Array.isArray(wallet.keystores) && wallet.keystores.length > 0 && (
      <a
        className="btn btn-success"
        onClick={onBackup}
        href={URL.createObjectURL(
          new Blob([JSON.stringify(wallet.keystores)], {
            type: 'application/json',
          }),
        )}
        download={`UTC--${new Date().toISOString()}-${wallet.keystores[0].address}.json`}
      >
        Download Backup File
      </a>
    )}
  </span>
);

BackupWalletButton.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  onBackup: PropTypes.func,
};

BackupWalletButton.defaultProps = {
  onBackup: () => {},
};

export default BackupWalletButton;
