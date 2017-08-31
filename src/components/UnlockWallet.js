import React, { Component } from 'react'
import PropTypes from 'prop-types'

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

  submit = ({ password }) => {
    this.setState({
      unlocking: true
    }, () => {
      const unlock = () => {
        this.props.wallet.unlock(password)
          .then(() => {
            this.setState({
              unlocking: false
            });
            this.props.onClose();
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
    const { onClose } = this.props;
    const { unlocking, error } = this.state;

    return (
      <SkyLightStateless
        isVisible={true}
        hideOnOverlayClicked
        title={'Enter your password to unlock your wallet!'}
        onCloseClicked={onClose}>

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

export default UnlockWallet;

UnlockWallet.propTypes = {
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
