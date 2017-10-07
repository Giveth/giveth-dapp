import React, { Component } from 'react';
import { Form, Input } from 'formsy-react-components';
import GivethWallet from '../lib/blockchain/GivethWallet';
import BackupWallet from "./BackupWallet";
import { socket, feathersClient } from '../lib/feathersClient'


/**

 generates a new GivethWallet

 **/

class NewWallet extends Component {
  constructor() {
    super();

    this.state = {
      error: undefined,
      formIsValid: false,
      wallet: undefined,
    };

    this.submit = this.submit.bind(this);
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

    let wallet = undefined;
    GivethWallet.createWallet(this.props.provider, password)
      .then(w => {
        wallet = w;
        return this.props.authenticate(wallet);
      })
      .then(() => this.setState({ wallet }))
      .catch((error) => {
        if (typeof error === 'object') {
          console.error(error);
          error = "Error creating wallet."
        }

        this.setState({ error })
      });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }

  render() {
    const { wallet, error, formIsValid } = this.state;

    if (wallet) {
      return (
        <div>
          <center>
            <h1>Backup your new Wallet!</h1>
          </center>

          <div className="alert alert-info">
            We <strong>highly</strong> recommend that you download this backup file and keep it in a safe place. If you loose this file
            or forget your wallet password, you will not be able to access this account and all funds associated with
            it.
          </div>

          <BackupWallet onBackup={this.props.onBackup} wallet={wallet}/>
        </div>
      )
    }

    return (
      <div>
        <center>
          <h1>Create Wallet!</h1>
        </center>

        {error &&
        <div className="alert alert-danger">{error}</div>
        }

        <Form className="sign-up-form" onSubmit={this.submit} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
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

          <button className="btn btn-success" formNoValidate={true} type="submit" disabled={!formIsValid}>
            Create Wallet
          </button>

        </Form>
      </div>
    )
  }
}

export default NewWallet;
