import React, { Component } from 'react';
import { File, Form, Input } from 'formsy-react-components';
import GivethWallet from '../lib/GivethWallet';

/**

 generates a new GivethWallet from an existing keystore file

 **/

class LoadWallet extends Component {
  constructor() {
    super();

    this.state = {
      error: undefined,
      validForm: false,
    };

    this.submit = this.submit.bind(this);
    this.onValid = this.onValid.bind(this);
    this.onInvalid = this.onInvalid.bind(this);
  }

  submit({ keystore, password }) {
    this.setState({
      error: undefined,
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
        .then(wallet => this.props.walletLoaded(wallet))
        .catch((error) => {
          if (typeof error === 'object') {
            console.error(error);
            error = "Error loading wallet."
          }

          this.setState({ error })
        });
    };

    reader.readAsText(keystore[ 0 ]);
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
    const { error } = this.state;

    return (
      <div>
        {error &&
          <div className="alert alert-danger">{error}</div>
        }

        <Form className="sign-in-form" onSubmit={this.submit} onValid={this.onValid} onInvalid={this.onInvalid} layout='vertical'>
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

          <button className="btn btn-success btn-lg" formNoValidate={true} type="submit" disabled={!this.state.validForm}>
            Load Wallet
          </button>

        </Form>
      </div>
    )
  }
}

export default LoadWallet;
