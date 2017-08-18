import React, { Component } from 'react';
import { Form, Input } from 'formsy-react-components';
import GivethWallet from '../lib/GivethWallet';
import BackupWallet from "./BackupWallet";

/**

 generates a new GivethWallet

 **/

class NewWallet extends Component {
  constructor() {
    super();

    this.state = {
      error: undefined,
      validForm: false,
      wallet: undefined,
    };

    this.submit = this.submit.bind(this);
    this.onValid = this.onValid.bind(this);
    this.onInvalid = this.onInvalid.bind(this);
  }

  componentDidMount() {
    this.focusFirstInput();
  }

  focusFirstInput() {
    setTimeout(() => this.refs.password.element.focus(), 0)
  }

  submit({ password }) {
    this.setState({
      error: undefined,
    });

    GivethWallet.createWallet(this.props.provider, password)
      .then(wallet => {
        this.props.walletCreated(wallet);
        this.setState({ wallet });
      })
      .catch((error) => {
        if (typeof error === 'object') {
          console.error(error);
          error = "Error creating wallet."
        }

        this.setState({ error })
      });
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
    const { wallet, error } = this.state;

    if (wallet) {
      return (
        <BackupWallet wallet={wallet}/>
      )
    }

    return (
      <div>
        {error &&
        <div className="alert alert-danger">{error}</div>
        }

        <Form onSubmit={this.submit} onValid={this.onValid} onInvalid={this.onInvalid} layout='vertical'>
          <div className="form-group">
            <Input
              name="password"
              id="password-input"
              label="Wallet Password"
              ref="password"
              type="password"
              placeholder="Choose a password"
              required
            />
          </div>
          <div className="form-group">
            <Input
              name="password2"
              id="password2-input"
              label="Confirm Wallet Password"
              type="password"
              validations="equalsField:password"
              validationErrors={{
                equalsField: 'Passwords do not match.',
              }}
              placeholder="Retype password"
              required
            />
          </div>

          <button className="btn btn-success" formNoValidate={true} type="submit" disabled={!this.state.validForm}>
            Create Wallet
          </button>

        </Form>
      </div>
    )
  }
}

export default NewWallet;
