import React, {Component} from 'react'
import {Form, Input} from 'formsy-react-components';
import localforage from "localforage";

import NewWallet from "../NewWallet";
import LoadWallet from "../LoadWallet";
import GivethWallet from "../../lib/GivethWallet";

/**
 SignIn Page
 **/

class SignIn extends Component {
  constructor() {
    super();

    this.state = {
      error: undefined,
      validForm: false,
      newWallet: false,
      keystore: undefined,
    };

    this.submit = this.submit.bind(this);
    this.onValid = this.onValid.bind(this);
    this.onInvalid = this.onInvalid.bind(this);
    this.removeKeystore = this.removeKeystore.bind(this);
    this.newWallet = this.newWallet.bind(this);
    this.walletLoaded = this.walletLoaded.bind(this);
    this.focusFirstInput = this.focusFirstInput.bind(this);
  }

  componentDidMount() {
    localforage.getItem('keystore')
    .then((keystore) => {
      if (keystore) {
        GivethWallet.getKeystoreAddress(keystore)
        .then(addr => {
          this.setState({
            keystore,
            address: addr
          });
        })
        .catch((err) => {
          this.setState({
            error: err,
          });
        });
      }
    });

    // this.focusFirstInput();
  }

  focusFirstInput() {
    setTimeout(() => this.refs.password.element.focus(), 0)
  }

  submit({password}) {
    GivethWallet.loadWallet(this.state.keystore, password)
    .then(wallet => this.walletLoaded(wallet))
    .catch((error) => {
      if (typeof error === 'object') {
        console.error(error);
        error = "Error unlocking wallet."
      }

      this.setState({error})
    });
  }

  walletLoaded(wallet) {
    this.props.handleWalletChange(wallet);
    this.props.history.push('/profile');
  }

  removeKeystore() {
    this.setState({
      address: undefined,
      keystore: undefined
    });
    this.props.handleWalletChange(undefined);
  }

  newWallet() {
    this.setState({
      newWallet: true,
    })
  }

  onValid() {
    this.setState({
      validForm: true,
    })
  }

  onInvalid() {
    this.setState({
      validForm: false,
    })
  }

  render() {
    const {newWallet, keystore, address} = this.state;

    return (
      <div id="signin-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div>
              {newWallet &&
              <div>
                <h1>Create Wallet!</h1>
                <NewWallet walletCreated={this.props.handleWalletChange}/>
              </div>
              }

              {!newWallet && keystore &&
              <div>
                <h1>Welcome {address}!</h1>
                <Form onSubmit={this.submit} onValid={this.onValid} onInvalid={this.onInvalid} layout='vertical'>
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

                  <button className="btn btn-success" formNoValidate={true} type="submit"
                          disabled={!this.state.validForm}>Unlock Wallet</button>
                </Form>
                <button className="btn btn-link" onClick={this.removeKeystore}>Not {address}?</button>
              </div>
              }

              {!newWallet && !keystore &&
              <div>
                <h1>Sign In!</h1>
                <LoadWallet walletLoaded={this.walletLoaded}/>
                <button className="btn btn-link" onClick={this.newWallet}>New User?</button>
              </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SignIn;