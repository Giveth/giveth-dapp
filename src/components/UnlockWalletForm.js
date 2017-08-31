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
    };
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

  render() {
    const { error, label, submit, buttonText, unlocking } = this.props;
    const { formIsValid } = this.state;

    return (
      <span>
       {error &&
       <div className="alert alert-danger">{error}</div>
       }
        <Form className="unlock-wallet-form" onSubmit={submit} onValid={() => this.toggleFormValid(true)}
              onInvalid={() => this.toggleFormValid(false)} layout='vertical'>
          <div className="form-group">
            <Input
              name="password"
              id="password-input"
              label={label}
              type="password"
              ref="password"
              required
            />
          </div>

          <LoaderButton
            className="btn btn-success btn-lg"
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