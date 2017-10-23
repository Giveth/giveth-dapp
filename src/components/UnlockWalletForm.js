import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Form, Input } from 'formsy-react-components';

import LoaderButton from "../components/LoaderButton"

/**
 * simple for with only a password field for unlocking a wallet. Any children will be displayed after the unlock button
 */
class UnlockWalletForm extends Component {
  constructor() {
    super();

    this.state = {
      formIsValid: false,
      password: ''
    };

    this.submit = this.submit.bind(this)    
  }

  componentDidMount() {
    setTimeout(this.focusInput, 500);
  }

  focusInput = () => {
    this.refs.password.element.focus();
  };

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }

  submit(model){
    this.props.submit(model)
  }

  render() {
    const { error, label, buttonText, unlocking } = this.props;
    const { formIsValid, password } = this.state;

    return (
      <span id="account-view">
       {error &&
       <div className="alert alert-danger">{error}</div>
       }
        <Form className="unlock-wallet-form" onSubmit={this.submit} onValid={() => this.toggleFormValid(true)}
              onInvalid={() => this.toggleFormValid(false)} layout='vertical'>

          <center>
            <img className="empty-state-img" src={process.env.PUBLIC_URL + "/img/unlock wallet.svg"} width="150px" height="150px" alt="unlock wallet icon"/>
          </center>              
          
          <div className="form-group">
            <Input
              value={password}
              name="password"
              id="password-input"
              label={label}
              type="password"
              ref="password"
              required
            />
          </div>

          <LoaderButton
            className="btn btn-success"
            formNoValidate={true} type="submit"
            disabled={unlocking || !formIsValid}
            isLoading={unlocking}
            loadingText="Unlocking your wallet...">
              {buttonText}
          </LoaderButton>

          {this.props.children}

          </Form>
     </span>
    )
  }
}

export default UnlockWalletForm;

UnlockWalletForm.propTypes = {
  submit: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  buttonText: PropTypes.string.isRequired,
  unlocking: PropTypes.bool.isRequired,
};