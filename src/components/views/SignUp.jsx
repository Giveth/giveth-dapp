import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'formsy-react-components';

import BaseWallet from '../../lib/blockchain/BaseWallet';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import BackupWallet from '../BackupWallet';
import { authenticate } from '../../lib/helpers';
import LoaderButton from '../../components/LoaderButton';

/* global window */
/**
 * The SignUp view mapped to /sign-up
 */

class SignUp extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      error: undefined,
      formIsValid: false,
      wallet: undefined,
      pass1: '',
      pass2: '',
    };

    this.submit = this.submit.bind(this);
  }

  onBackup() {
    this.props.history.push('/wallet');
  }

  // TODO: move this some place better
  createAppropriateWallet(provider, password) { // eslint-disable-line class-methods-use-this
    return new Promise((resolve, reject) => {
      if (typeof web3 !== 'undefined') {
        // if web3 exists use base wallet
        // declare web3 from window
        const { web3 } = window;
        // check if eth object is defined
        if (web3.eth) {
          // metamask account address is only made available within call back
          web3.eth.getAccounts((error, accounts) => {
            // TODO: handle error
            if (error) alert('error getting eth accounts');
            // TODO: error if zero length accounts returned
            if (accounts.length === 0)
              alert(
                'Zero accounts found in provided web3 object. You may need to log into a web3 browser or extension.',
              );
            // define from address as first account
            const fromAddress = accounts[0];
            // create base wallet
            return resolve(new BaseWallet(web3, fromAddress)); // eslint-disable-line no-console
          });
        } else {
          // TODO: return propper error
          return reject(alert('web3.eth is not defined'));
        }
      } else {
        return resolve(GivethWallet.createWallet(provider, password));
      }
    });
  }

  submit({ password }) {
    this.setState(
      {
        isSaving: true,
        error: undefined,
      },
      () => {
        function createWallet() {
          let wallet;
          // This times out on authenticate not sure why yet
          // could be config, feathers server, or base wallet issue
          this.createAppropriateWallet(this.props.provider, password)
            .then(w => {
              wallet = w;
              return wallet;
            })
            .then(authenticate)
            .then(() => {
              this.setState({
                isSaving: false,
                wallet,
              });

              this.props.walletCreated(wallet);
            })
            .catch(err => {
              let error;
              if (typeof err === 'object') {
                error =
                  err.type && err.type === 'FeathersError'
                    ? 'authentication error'
                    : 'Error creating wallet.';
              }

              this.setState({
                isSaving: false,
                error,
              });
            });
        }

        // web3 blocks all rendering, so we need to request an animation frame
        window.requestAnimationFrame(createWallet.bind(this));
      },
    );
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  render() {
    const { wallet, error, formIsValid, isSaving } = this.state;

    return (
      <div id="account-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div>
              <div className={`card ${wallet ? 'bg-warning' : ''} `}>
                <center>
                  {!wallet && (
                    <div>
                      <h1>SignUp</h1>
                      <p>
                        Your wallet is your account. Create a wallet to get
                        started with Giveth.
                      </p>

                      {error && (
                        <div className="alert alert-danger">{error}</div>
                      )}

                      <Form
                        className="sign-up-form"
                        onSubmit={this.submit}
                        onValid={() => this.toggleFormValid(true)}
                        onInvalid={() => this.toggleFormValid(false)}
                        layout="vertical"
                      >
                        <div className="form-group">
                          <Input
                            name="password"
                            autoComplete="new-password"
                            id="password-input"
                            label="Wallet Password"
                            type="password"
                            value={this.state.pass1}
                            placeholder="Choose a password"
                            required
                            autoFocus
                          />
                        </div>
                        <div className="form-group">
                          <Input
                            name="password2"
                            id="password2-input"
                            autoComplete="new-password"
                            label="Confirm Wallet Password"
                            type="password"
                            value={this.state.pass2}
                            validations="equalsField:password"
                            validationErrors={{
                              equalsField: 'Passwords do not match.',
                            }}
                            placeholder="Retype password"
                            required
                          />
                        </div>

                        <LoaderButton
                          className="btn btn-success btn-block"
                          formNoValidate
                          type="submit"
                          disabled={isSaving || !formIsValid}
                          isLoading={isSaving}
                          loadingText="Creating your wallet..."
                        >
                          Sign up
                        </LoaderButton>
                      </Form>
                    </div>
                  )}

                  {wallet && (
                    <div>
                      <center>
                        <h1>Back up your new Wallet!</h1>
                      </center>

                      <p>
                        We <strong>highly</strong> recommend that you download
                        this backup file and keep it in a safe place. If you
                        lose this file or forget your wallet password, you will
                        not be able to access this account and all funds
                        associated with it. Both this file and your password are
                        handled locally on your pc and in your browser: we
                        cannot help you recover anything, so please take a
                        minute to do this now.
                      </p>

                      <BackupWallet
                        onBackup={() => this.onBackup()}
                        wallet={wallet}
                      />
                    </div>
                  )}
                </center>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SignUp.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  walletCreated: PropTypes.func.isRequired,
  provider: PropTypes.shape({}),
};

SignUp.defaultProps = {
  provider: {},
};

export default SignUp;
