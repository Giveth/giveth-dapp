import React, { Component } from 'react';
import { File, Form, Input } from 'formsy-react-components';
import GivethWallet from "../../lib/GivethWallet";
import { socket, feathersClient } from '../../lib/feathersClient'

/**

 generates a new GivethWallet from an existing keystore file

 **/

class ChangeAccount extends Component {
  constructor() {
    super();

    this.state = {
      error: undefined,
      formIsValid: false,
      isLoading: false
    };

    this.submit = this.submit.bind(this);
  }

  submit({ keystore, password }) {
    this.setState({
      error: undefined,
      isLoading: true
    });

    const reader = new FileReader();

    reader.onload = e => {
      let parsedKeystore;

      try {
        parsedKeystore = JSON.parse(e.target.result);
      } catch (e) {
        this.setState({
          error: "Failed to parse keystore file",
        });
        return;
      }

      GivethWallet.loadWallet(parsedKeystore, this.props.provider, password)
        .then(wallet => this.walletLoaded(wallet))
        .catch((error) => {
          if (typeof error === 'object') {
            console.error(error);
            error = "Error loading wallet."
          }

          this.setState({ isLoading: false, error })
        });
    };

    reader.readAsText(keystore[ 0 ]);
  }

  walletLoaded(wallet) {
    socket.emit('authenticate', { signature: wallet.signMessage().signature }, () => {
      console.log('authenticated');
      this.props.handleWalletChange(wallet);

      const address = wallet.getAddresses()[ 0 ];

      // TODO this check should maybe be done in LoadWallet as that is when a keystore file is actually uploaded
      // However I'm putting this here for now as a users may have created a wallet in an earlier stage of the
      // mpv and thus it is stored in their localStorage, and the ui crashes if this user creates a milestone, etc
      feathersClient.service('/users').get(address)
        .then(() => this.props.history.push('/'))
        .catch(err => {
          if (err.code === 404) {
            feathersClient.service('/users').create({ address })
              .then(user => {
                console.log('created user ', user);
                this.props.history.push('/profile');
              })
          } else {
            this.props.history.goBack();
          }
        })

    });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }

  render() {
    const { error, isLoading, formIsValid } = this.state;

    return (
      <div id="account-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div className="card">
              <center>
                <h1>Sign in with an existing wallet</h1>

                {error &&
                  <div className="alert alert-danger">{error}</div>
                }

                <Form className="sign-in-form" onSubmit={this.submit} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
                  <div className="form-group">
                    <label>Wallet File</label>
                    <File
                      name="keystore"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <Input
                      name="password"
                      id="password-input"
                      label="Wallet Password"
                      type="password"
                      placeholder="Wallet password"
                      required
                    />
                  </div>

                  <button className="btn btn-success btn-lg" formNoValidate={true} type="submit" disabled={isLoading || !formIsValid}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </button>

                </Form>
              </center>
            </div>
          </div>
        </div>
      </div>   
    )
  }
}

export default ChangeAccount;
