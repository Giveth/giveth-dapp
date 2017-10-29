import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {withRouter} from "react-router-dom"

import { SkyLightStateless } from 'react-skylight'

import UnlockWalletForm from "./UnlockWalletForm";

/**
 * Modal with a form to unlock a GivethWallet
 */
class UnlockWallet extends Component {
  constructor() {
    super();

    this.state = {
      formIsValid: false,
      unlocking: false,
    };
  }

  submit({ password }) {
    this.setState({
      unlocking: true
    }, () => {
      const unlock = () => {
        this.props.wallet.unlock(password)
          .then(() => {
            this.setState({
              unlocking: false
            }, () => {
              this.props.onClose();

              // if requested, redirect after successfully unlocking the wallet
              if(this.props.redirectAfter) this.props.history.push(this.props.redirectAfter);
            })
          })
          .catch(error => {
            console.log(error);
            this.setState({
              error: "Error unlocking wallet. Possibly an invalid password.",
              unlocking: false,
            });
          });
      };

      // web3 blocks all rendering, so we need to request an animation frame
      window.requestAnimationFrame(unlock);
    });
  };


  render() {
    const { onClose, onCloseClicked } = this.props;
    const { unlocking, error } = this.state;

    return (
      <SkyLightStateless
        isVisible={true}
        hideOnOverlayClicked
        onCloseClicked={onCloseClicked}
        afterClose={onClose}>

        <center>
          <img className="empty-state-img reduce-margin" src={process.env.PUBLIC_URL + "/img/unlock wallet.svg"} width="130px" height="130px" alt="unlock wallet icon"/>
        </center>  

        <h2>Unlock your wallet to continue</h2>     
        <p className="small">Note: for security reasons your wallet auto-locks whenever the Giveth dapp reloads.</p>

        <UnlockWalletForm
          submit={this.submit}
          label="password"
          error={error}
          unlocking={unlocking}
          buttonText="Unlock"
        />

      </SkyLightStateless>
    )
  }
}

export default withRouter(UnlockWallet);

UnlockWallet.propTypes = {
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
