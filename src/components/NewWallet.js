import React, { Component } from 'react';
import { Form, Input } from 'formsy-react-components';
import GivethWallet from '../lib/GivethWallet';
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
        socket.emit('authenticate', { signature: wallet.signMessage().signature }, () => {
          // now create a user object
          console.log('authenticated, creating user...')

          feathersClient.service('/users').create({
            address: wallet.getAddresses()[0]
          }).then(user => console.log('created user ', user))           
        });

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
        <div>
          <h1>Backup your new Wallet!</h1>

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
        <h1>Create Wallet!</h1>

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
