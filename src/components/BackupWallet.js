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
      keystore: this.props.wallet.keystore,
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
          <p>
            <Loader/>
            Loading wallet...
          </p>
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
