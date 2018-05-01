import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { File, Form, Input } from 'formsy-react-components';

import GivethWallet from '../../lib/blockchain/GivethWallet';
import { feathersClient } from '../../lib/feathersClient';
import { authenticate } from '../../lib/helpers';
import LoaderButton from '../../components/LoaderButton';

/* global FileReader */
/**
 * The Change Account view mappet to /change-account
 * Allow uploading existing keystore File
 *
 * @param handleWalletChange  Function that saves new wallet for the application
 * @param history             Browser history object
 * @param provider
 */
class ChangeAccount extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: undefined,
      formIsValid: false,
      isLoading: false,
      password: '',
    };

    this.submit = this.submit.bind(this);
  }

  /**
   * Set the form valid strategy
   *
   * @param state Boolean value to set the validity of the form
   */
  setFormValid(state) {
    this.setState({ formIsValid: state });
  }

  /**
   * Submit the upload wallet form handler
   *
   * @param keystore  File containing the private key
   * @param password  Plain string password for the private key
   */
  submit({ keystore, password }) {
    this.setState({
      error: undefined,
      isLoading: true,
    });

    const reader = new FileReader();

    reader.onload = e => {
      let parsedKeystore;
      let wallet;

      // Try to parse the keystore file
      try {
        parsedKeystore = JSON.parse(e.target.result);
      } catch (error) {
        this.setState({
          error: 'Failed to parse keystore file',
        });
        return;
      }

      // mew wallets have uppercase crypto which breaks web3 unlocking
      if ('Crypto' in parsedKeystore) parsedKeystore.crypto = parsedKeystore.Crypto;

      // Attempt to load and decrypt the parsed wallet
      GivethWallet.loadWallet(parsedKeystore, this.props.provider, password)
        .then(w => {
          wallet = w;
          return wallet;
        })
        .then(authenticate)
        .then(token => {
          this.props.handleWalletChange(wallet);
          return feathersClient.passport.verifyJWT(token);
        })
        .then(payload => {
          if (payload.newUser) {
            // needs some time to fetch wallet balance and sign in the user
            setTimeout(
              () =>
                wallet.getBalance() >= React.minimumWalletBalance
                  ? this.props.history.push('/profile')
                  : this.props.history.push('/wallet'),
              500,
            );
          } else {
            this.props.history.push('/');
          }
        })
        .catch(error => {
          if (typeof error === 'object') {
            this.setState({
              error:
                error.type && error.type === 'FeathersError'
                  ? 'Authentication error'
                  : 'Error unlocking wallet. Possibly an invalid password.',
              isLoading: false,
            });
          }
        });
    };

    reader.readAsText(keystore[0]);
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

                {error && <div className="alert alert-danger">{error}</div>}

                <Form
                  className="sign-in-form"
                  onSubmit={this.submit}
                  onValid={() => this.setFormValid(true)}
                  onInvalid={() => this.setFormValid(false)}
                  layout="vertical"
                >
                  <div className="form-group">
                    <File id="keystore" label="Wallet File" name="keystore" required />
                  </div>
                  <div className="form-group">
                    <Input
                      name="password"
                      id="password-input"
                      label="Wallet Password"
                      type="password"
                      value={this.state.password}
                      placeholder="Wallet password"
                      required
                    />
                  </div>

                  <LoaderButton
                    className="btn btn-success btn-lg"
                    formNoValidate
                    type="submit"
                    disabled={isLoading || !formIsValid}
                    isLoading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign in
                  </LoaderButton>

                  <div className="form-group">
                    <p className="small">
                      Don&apos;t have a wallet?&nbsp;
                      <Link to="/signup">Sign up instead!</Link>
                    </p>
                  </div>
                </Form>
              </center>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ChangeAccount.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  provider: PropTypes.shape({}),
  handleWalletChange: PropTypes.func.isRequired,
};

ChangeAccount.defaultProps = {
  provider: {},
};

export default ChangeAccount;
