import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import UnlockWalletForm from '../UnlockWalletForm';
import { authenticate } from '../../lib/helpers';

/* global window */
/**
 * The SignIn view mapped to /sign-in
 */
class SignIn extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      error: undefined,
      address: undefined,
      isSigninIn: false,
    };

    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.handleProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.handleProps(nextProps);
  }

  handleProps(props) {
    if (!props.cachedWallet) {
      this.props.history.push('/change-account');
    } else if (props.wallet && (!this.state.address || props.wallet !== this.props.wallet)) {
      this.setState({
        address: props.wallet.getAddresses()[0],
      }, () => this.fetchUserProfile());
    }
  }

  fetchUserProfile() {
    feathersClient.service('users').get(this.state.address)
      .then((resp) => {
        this.setState(Object.assign({}, resp, {
          isLoading: false,
        }));
      })
      .catch(() => {
        this.setState({
          isLoading: false,
        });
      });
  }

  submit(password) {
    this.setState({
      isSigninIn: true,
      error: undefined,
    }, () => {
      function loadWallet() {
        this.props.wallet.unlock(password)
          .then(() => authenticate(this.props.wallet))
          .then((token) => {
            this.props.onSignIn();
            return feathersClient.passport.verifyJWT(token);
          })
          .then(() => {
            React.toast.success(<p>Welcome back! <br />Note that your wallet is unlocked and will
              <strong>auto-lock</strong> upon page refresh.
                                </p>);
            this.props.history.goBack();
          })
          .catch((err) => {
            this.setState({
              error: (err.type && err.type === 'FeathersError') ?
                'authentication error' :
                'Error unlocking wallet. Possibly an invalid password.',
              isSigninIn: false,
            });
          });
      }

      // web3 blocks all rendering, so we need to request an animation frame
      window.requestAnimationFrame(loadWallet.bind(this));
    });
  }

  render() {
    const {
      avatar, name, address, error, isLoading, isSigninIn,
    } = this.state;

    if (isLoading) {
      return <Loader className="fixed" />;
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
                      <Avatar size={100} src={avatar} round />
                    }

                    {name &&
                      <h1>Welcome back<br /><strong>{name}!</strong></h1>
                    }

                    {address && !name &&
                      <div><h1>Welcome back</h1><strong>{address}</strong></div>
                    }

                    { name &&
                      <p className="small">Your address: {address}</p>
                    }

                    <div className="spacer-top">
                      <UnlockWalletForm
                        submit={this.submit}
                        label="Sign in by entering your wallet password"
                        error={error}
                        buttonText="Sign in"
                        unlocking={isSigninIn}
                      >
                        <div className="form-group">
                          <p className="small">
                            <Link to="/signup">Not you</Link>, or&nbsp;
                              <Link to="/change-account">want to change wallet?</Link>
                          </p>
                        </div>
                      </UnlockWalletForm>
                    </div>
                  </center>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SignIn.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  wallet: PropTypes.shape({
    unlock: PropTypes.func.isRequired,
  }).isRequired,
  onSignIn: PropTypes.func.isRequired,
};

export default SignIn;
