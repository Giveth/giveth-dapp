import React, { Component } from 'react';
import { Form, Input } from 'formsy-react-components';
import GivethWallet from "../../lib/GivethWallet";
import BackupWallet from "../BackupWallet";
import { authenticate } from "../../lib/helpers";
import LoaderButton from "../../components/LoaderButton"
/**

 generates a new GivethWallet

 **/

class Signup extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,      
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
      isSaving: true,
      error: undefined,
    }, () => {
      function createWallet() {
        let wallet = undefined;
        GivethWallet.createWallet(this.props.provider, password)
          .then(w => wallet = w)
          .then(authenticate)
          .then(() => {
            this.setState({
              isSaving: false,
              wallet
            });

            this.props.walletCreated(wallet);
          })
          .catch((error) => {
            if (typeof error === 'object') {
              console.error(error);
              error = (error.type && error.type === 'FeathersError') ? "authentication error" :
                "Error creating wallet.";
            }

            this.setState({ 
              isSaving: false,
              error 
            })
          });
        }

      // web3 blocks all rendering, so we need to request an animation frame        
      window.requestAnimationFrame(createWallet.bind(this))

    })
  }

  onBackup(){
    this.props.history.push('/profile')
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }

  render() {
    const { wallet, error, formIsValid, isSaving } = this.state;

    return (
      <div id="account-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div>

              <div className={`card ${ wallet ? 'bg-warning' : ''} `}>
                <center>

                  { !wallet &&
                    <div>

                      <h1>Signup</h1>
                      <p>Your wallet is your account. Create a wallet to get started with Giveth.</p>

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

                        <LoaderButton
                          className="btn btn-success btn-block" 
                          formNoValidate={true} type="submit" 
                          disabled={isSaving || !formIsValid}
                          isLoading={isSaving}
                          loadingText="Creating your wallet...">
                          Sign up
                        </LoaderButton>

                      </Form>
                    </div>
                  }

                  { wallet &&
                    <div>
                      <center>
                        <h1>Backup your new Wallet!</h1>
                      </center>

                      <p>
                        We <strong>highly</strong> recommend that you download this backup file and keep it in a safe place. If you loose this file
                        or forget your wallet password, you will not be able to access this account and all funds associated with
                        it.
                      </p>

                      <BackupWallet onBackup={()=>this.onBackup()} wallet={wallet}/>
                    </div>
                  }

                </center>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Signup;
