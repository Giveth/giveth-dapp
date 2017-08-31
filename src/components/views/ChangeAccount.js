import React, { Component } from 'react';
import { File, Form, Input } from 'formsy-react-components';
import GivethWallet from "../../lib/GivethWallet";
import { feathersClient } from '../../lib/feathersClient'
import { authenticate } from '../../lib/helpers';
import LoaderButton from "../../components/LoaderButton"
import { Link } from 'react-router-dom'

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

      let wallet = undefined;
      GivethWallet.loadWallet(parsedKeystore, this.props.provider, password)
        .then(w => wallet = w)
        .then(authenticate)
        .then(token => {
          this.props.handleWalletChange(wallet);
          return feathersClient.passport.verifyJWT(token);
        })
        .then(payload => {
          payload.newUser ? this.props.history.push('/profile') : this.props.history.push('/');
        })
        .catch((error) => {
          if (typeof error === 'object') {
            console.error(error);

            error = (error.type && error.type === 'FeathersError') ? "authentication error" :
              "Error unlocking wallet. Possibly an invalid password.";
          }

          this.setState({ isLoading: false, error })
        });
    };

    reader.readAsText(keystore[ 0 ]);
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

                  <LoaderButton
                    className="btn btn-success btn-lg" 
                    formNoValidate={true} type="submit" 
                    disabled={isLoading || !formIsValid}
                    isLoading={isLoading}
                    loadingText="Signing in...">
                    Sign in
                  </LoaderButton>     

                  <div className="form-group">
                    <p className="small">
                      Don't have a wallet?&nbsp;
                      <Link to="/signup">Sign up instead!</Link>
                    </p>
                  </div>                               

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
