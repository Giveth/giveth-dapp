import React, { Component } from 'react';
import Loader from './Loader'

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

  componentDidMount() {
    this.setState({
      keystore: this.props.wallet.keystores[0],
      isLoading: false,
    });
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
          <div>
            <Loader/>
            Loading wallet...
          </div>
        }

        {!isLoading &&
          <a className="btn btn-success"
             onClick={this.handleClick}
             href={URL.createObjectURL(new Blob([JSON.stringify(keystore)], {type:'application/json'}))}
             download={'givethKeystore-' + Date.now() + '.json'}>
            Download Backup File
          </a>
        }
      </div>
    );
  }
}

export default BackupWallet;
