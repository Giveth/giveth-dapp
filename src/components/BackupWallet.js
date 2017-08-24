import React, { Component } from 'react';

/**

 backup a GivethWallet

 **/

class BackupWallet extends Component {
  constructor(){
    super()

    this.state = {
      isLoading: true
    }
  }

  componentDidMount(){
    this.props.wallet.getKeystore((keystore) => {
      this.setState({ keystore: keystore, isLoading: false })
    })
  }

  handleClick = () => {
    if (this.props.onBackup) {
      this.props.onBackup();
    }
  }

  render() {
    let { isLoading, keystore } = this.state

    return (
      <div>
        {isLoading && 
          <p>Loading wallet...</p>
        }

        {!isLoading &&
          <a className="btn btn-success"
             onClick={this.handleClick}
             href={"data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(keystore))}
             download={'givethKeystore-' + Date.now() + '.json'}>
            Download Backup File
          </a>
        }
      </div>
    );
  }
}

export default BackupWallet;
