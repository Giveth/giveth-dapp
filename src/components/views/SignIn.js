import React, { Component } from 'react'
import { Form, Input } from 'formsy-react-components'
import localforage from "localforage";

import GivethWallet from "../../lib/GivethWallet";
import { socket, feathersClient } from '../../lib/feathersClient'
import Loader from "../Loader";
import Avatar from 'react-avatar'
import { Link } from 'react-router-dom'
import LoaderButton from "../../components/LoaderButton"


/**
 SignIn Page
 **/

class SignIn extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      error: undefined,
      formIsValid: false,
      keystore: undefined,
      isSigninIn: false
    };

    this.submit = this.submit.bind(this);
    this.removeKeystore = this.removeKeystore.bind(this);
    this.newWallet = this.newWallet.bind(this);
  }

  componentDidMount() {
    localforage.getItem('keystore')
      .then((keystore) => {
        if (keystore && keystore.length > 0) {
          this.setState({
              keystore,
              address: GivethWallet.fixAddress(keystore[ 0 ].address),
            },
            // try to find the user's profile based on the address
            () => this.fetchUserProfile());
        } else {
          this.props.history.push('/change-account');
        }

      })
      .catch(() => {
        this.setState({
          isLoading: false,
        });
      });
  }

  componentWillUpdate() {
    if (this.state.keystore) {
      setTimeout(() => {
        if (this.refs.password) {
          this.refs.password.element.focus()
        }
      }, 500);
    }
  }

  fetchUserProfile() {
    socket.emit('users::find', { address: this.state.address }, (error, resp) => {
      console.log(error, resp)
      if (resp) {
        this.setState(Object.assign({}, resp.data[ 0 ], {
          isLoading: false,
        }))
      } else {
        this.setState({
          isLoading: false,
        })
      }
    })
  }

  submit({ password }) {
    this.setState({
      isSigninIn: true,
      error: undefined
    }, () => {
      function createWallet() {
        GivethWallet.loadWallet(this.state.keystore, this.props.provider, password)
          .then(wallet => this.walletLoaded(wallet))
          .catch((error) => {
            console.error(error);

            this.setState({
              error: "Error unlocking wallet. Possibly an invalid password.",
              isSigninIn: false
            });
          });
      }

      // web3 blocks all rendering, so we need to request an animation frame        
      window.requestAnimationFrame(createWallet.bind(this))
          
    })
  }

  authenticate = wallet => {
    const authData = {
      strategy: 'web3',
      address: wallet.getAddresses()[ 0 ],
    };

    return new Promise((resolve, reject) => {
      feathersClient.authenticate(authData)
        .catch(response => {
          // normal flow will issue a 401 with a challenge message we need to sign and send to verify our identity
          if (response.code === 401 && response.data.startsWith('Challenge =')) {
            const msg = response.data.replace('Challenge =', '').trim();

            return resolve(wallet.signMessage(msg).signature);
          }
          return reject(response);
        })
    }).then(signature => {
      authData.signature = signature;
      return feathersClient.authenticate(authData)
    }).then(response => {
      console.log('Authenticated!');

      this.props.handleWalletChange(wallet);
      return response.accessToken;
    });
  };

  walletLoaded = wallet => {
    this.authenticate(wallet)
      .then(token => {
        return feathersClient.passport.verifyJWT(token);
      })
      .then(payload => {
        payload.newUser ? this.props.history.push('/profile') : this.props.history.goBack();
      })
      .catch(err => {
        console.log(err)
      });
  };

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }

  render() {
    const { keystore, avatar, name, address, error, isLoading, formIsValid, isSigninIn } = this.state;

    if (isLoading) {
      return <Loader className="fixed"/>
    }

    return (
      <div id="account-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            <div>
              { keystore &&
                <div className="card">
                  <center>
                    {avatar &&
                      <Avatar size={100} src={avatar} round={true}/>                  
                    }
                    <h1>Welcome back<br/><strong>{name || address}!</strong></h1>
                    { name &&
                      <p className="small">Your address: {address}</p>
                    }

                    {error &&
                      <div className="alert alert-danger">{error}</div>
                    }
                    <Form className="sign-in-form" onSubmit={this.submit} onValid={()=>this.toggleFormValid(true)}
                          onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
                      <div className="form-group">
                        <Input
                          name="password"
                          id="password-input"
                          label="Sign in by entering your wallet password"
                          type="password"
                          ref="password"
                          required
                        />
                      </div>

                      <LoaderButton
                        className="btn btn-success btn-lg" 
                        formNoValidate={true} type="submit" 
                        disabled={isSigninIn || !formIsValid}
                        isLoading={isSigninIn}
                        loadingText="Unlocking your wallet...">
                        Sign in
                      </LoaderButton>                      

                      <div className="form-group">
                        <p className="small">
                          <Link to="/signup">Not you</Link>, or&nbsp;
                          <Link to="/change-account">want to change wallet?</Link>
                        </p>
                      </div>

                    </Form>
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