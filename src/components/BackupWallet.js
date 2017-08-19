import React, { Component } from 'react';

/**

 backup a GivethWallet

 **/

class BackupWallet extends Component {
  handleClick = () => {
    if (this.props.onBackup) {
      this.props.onBackup();
    }
  };

  render() {
    return (
      <a className="btn btn-success"
         onClick={this.handleClick}
         href={"data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.props.wallet.getKeystore()))}
         download={'givethKeystore-' + Date.now() + '.json'}>
        Download Backup File
      </a>
    );
  }
}

export default BackupWallet;
