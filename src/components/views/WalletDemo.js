import React, {Component} from 'react'
import {File, Form, Input} from 'formsy-react-components';

import GivethWallet from '../../lib/GivethWallet';

/**
 Demo wallet functionality
 **/

class WalletDemo extends Component {
  constructor() {
    super();

    this.state = {
      wallet: undefined,
      seed: undefined,
      addresses: undefined,
    };

    this.reset = this.reset.bind(this);
    this.getSeed = this.getSeed.bind(this);
    this.importSeed = this.importSeed.bind(this);
    this.createWallet = this.createWallet.bind(this);
    this.importWallet = this.importWallet.bind(this);
  }

  reset() {
    this.setState({
      wallet: undefined,
      seed: undefined,
      addresses: undefined,
    });
  }

  createWallet({password}) {
    this.reset();

    GivethWallet.createWallet(password)
    .then(wallet =>
      this.setState({
        wallet,
        addresses: wallet.getAddresses(),
      }),
    )
    .catch((error) => this.setState({error}));
  }

  importSeed({password, seed}) {
    this.reset();

    GivethWallet.createWallet(password, seed)
    .then(wallet =>
      this.setState({
        wallet,
        addresses: wallet.getAddresses(),
      }),
    )
    .catch((error) => this.setState({error}));
  }

  importWallet({keystore, password}) {
    this.reset();
    const reader = new FileReader();

    reader.onload = e => {
      GivethWallet.loadWallet(e.target.result, password)
      .then(wallet =>
        this.setState({
          wallet,
          addresses: wallet.getAddresses(),
        }),
      )
      .catch((error) => this.setState({error}));
    };

    reader.readAsText(keystore[0]);

  }

  getSeed() {
    const password = prompt("Enter your wallet password:");
    this.state.wallet.getSeed(password)
    .then((seed) => this.setState({seed}))
    .catch((error) => this.setState({error}));
  }

  render() {
    let {addresses, seed, wallet, error} = this.state;
    let keystoreHREF = (wallet) ? "data:text/json;charset=utf-8," + encodeURIComponent(wallet.keystore.serialize()) : "";

    return (
      <div id="profile-view" className="container-fluid page-layout">
        <center>
          <h1>Wallet</h1>

          <p>wallet addresses: {addresses}</p>
          <p>wallet seed: {seed}</p>

          <button className="btn btn-success" onClick={this.getSeed} disabled={!wallet}>Show Wallet Seed</button>
          <a className={"btn btn-success " + (wallet ? "" : "disabled")}
             href={keystoreHREF}
             download={'givethKeystore-' + Date.now() + '.json'} disabled={!wallet}>
            Download Backup File
          </a>
        </center>

        {error && <p className="text-danger">{error}</p>}

        <h3>Import Wallet</h3>
        <Form onSubmit={this.importWallet}
              layout='horizontal'>
          <div className="form-group">
            <File
              label="Wallet File"
              name="keystore"
              ref="keystore"
              required
            />
          </div>
          <Input
            name="password"
            id="password-input"
            label="Wallet Password"
            ref="password"
            type="password"
            required
          />

          <button className="btn btn-success" type="submit">Import</button>
        </Form>
        <br/>

        <h3>Import Seed</h3>
        <Form onSubmit={this.importSeed}
              layout='horizontal'>
          <div className="form-group">
            <Input
              name="seed"
              id="seed-input"
              label="Seed Phrase"
              ref="seed"
              type="text"
              required
            />
          </div>
          <Input
            name="password"
            id="password-input"
            label="Wallet Password"
            ref="password"
            type="password"
            required
          />

          <button className="btn btn-success" type="submit">Import</button>
        </Form>
        <br/>

        <h3>Create Wallet</h3>
        <Form onSubmit={this.createWallet}
              layout='horizontal'>
          <div className="form-group">
            <Input
              name="password"
              id="password-input"
              label="Wallet Password"
              ref="password"
              type="password"
              required
            />
          </div>

          <button className="btn btn-success" type="submit">Create New Wallet</button>

        </Form>
      </div>
    )
  }
}

export default WalletDemo;