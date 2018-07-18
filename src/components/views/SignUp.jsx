import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'formsy-react-components';

import GivethWallet from '../../lib/blockchain/GivethWallet';
import { authenticate } from '../../lib/helpers';
import LoaderButton from '../LoaderButton';

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
      pass1: '',
      pass2: '',
    };

    this.submit = this.submit.bind(this);
  }

  submit({ password }) {
    this.setState(
      {
        isSaving: true,
        error: undefined,
      },
      () => {
        async function createWallet() {
          try {
            const wallet = await GivethWallet.createWallet(password);

            await authenticate(wallet);

            this.props.walletCreated(wallet, 'backupwallet');
          } catch (err) {
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
          }
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
    const { error, formIsValid, isSaving } = this.state;

    return (
      <div id="account-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div>
              <div className="card">
                <center>
                  <div>
                    <h1>SignUp</h1>
                    <p>Your wallet is your account. Create a wallet to get started with Giveth.</p>

                    {error && <div className="alert alert-danger">{error}</div>}

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
  walletCreated: PropTypes.func.isRequired,
};

export default SignUp;
