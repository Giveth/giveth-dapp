import React, { Component } from 'react'

import { feathersClient } from '../../lib/feathersClient'
import Loader from "../Loader";
import Avatar from 'react-avatar'
import { Link } from 'react-router-dom'

import UnlockWalletForm from "../UnlockWalletForm";
import { authenticate } from "../../lib/helpers";

/**
 SignIn Page
 **/

class SignIn extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      error: undefined,
      address: undefined,
      formIsValid: false,
      isSigninIn: false
    };

    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.handleProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.handleProps(nextProps);
  }

  componentWillUpdate() {
    if (this.props.wallet) {
      setTimeout(() => {
        if (this.refs.password) {
          this.refs.password.element.focus()
        }
      }, 500);
    }
  }

  handleProps(props) {
    if (!props.cachedWallet) {
      this.props.history.push('/change-account');
    }
    else if (props.wallet && (!this.state.address || props.wallet !== this.props.wallet)) {
        this.setState({
          address: props.wallet.getAddresses()[ 0 ],
        }, () => this.fetchUserProfile());
    }
  }

  fetchUserProfile() {
    feathersClient.service('users').get(this.state.address)
      .then(resp => {
        this.setState(Object.assign({}, resp.data, {
          isLoading: false,
        }));
      })
      .catch(error => {
        console.log(error);
        this.setState({
          isLoading: false,
        });
      });
  }

  submit({ password }) {
    this.setState({
      isSigninIn: true,
      error: undefined
    }, () => {
      function createWallet() {
        this.props.wallet.unlock(password)
          .then(() => authenticate(this.props.wallet))
          .then(token => {
            this.props.onSignIn();
            return feathersClient.passport.verifyJWT(token);
          })
          .then(() => this.props.history.goBack())
          .catch((err) => {
            console.error(err);

            const error = (err.type && err.type === 'FeathersError') ? "authentication error" :
              "Error unlocking wallet. Possibly an invalid password.";

            this.setState({
              error,
              isSigninIn: false
            });
          });
      }

      // web3 blocks all rendering, so we need to request an animation frame
      window.requestAnimationFrame(createWallet.bind(this))

    });
  }

  render() {
    const { avatar, name, address, error, isLoading, isSigninIn } = this.state;

    if (isLoading) {
      return <Loader className="fixed"/>
    }

    return (
      <div id="account-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div>
              { this.props.wallet &&
                <div className="card">
                  <center>
                    {avatar &&
                      <Avatar size={100} src={avatar} round={true}/>
                    }
                    <h1>Welcome back<br/><strong>{name || address}!</strong></h1>
                    { name &&
                      <p className="small">Your address: {address}</p>
                    }

                    <UnlockWalletForm
                      submit={this.submit}
                      label="Sign in by entering your wallet password"
                      error={error}
                      buttonText="Sign in"
                      unlocking={isSigninIn}>
                        <div className="form-group">
                          <p className="small">
                            <Link to="/signup">Not you</Link>, or&nbsp;
                            <Link to="/change-account">want to change wallet?</Link>
                          </p>
                        </div>
                    </UnlockWalletForm>
                  </center>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SignIn;