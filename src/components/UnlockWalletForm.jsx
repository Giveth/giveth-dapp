import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'formsy-react-components';

import LoaderButton from './LoaderButton';

/**
 * Simple for with only a password field for unlocking a wallet.
 * Any children will be displayed after the unlock button
 */
class UnlockWalletForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formIsValid: false,
      password: '',
    };

    this.submit = this.submit.bind(this);
    this.toggleFormValid = this.toggleFormValid.bind(this);
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  submit(model) {
    this.props.submit(model.password);
  }

  render() {
    const { error, label, buttonText, unlocking } = this.props;
    const { formIsValid, password } = this.state;

    return (
      <span id="account-view">
        {error && <div className="alert alert-danger">{error}</div>}

        <Form
          className="unlock-wallet-form"
          onSubmit={this.submit}
          onValid={() => this.toggleFormValid(true)}
          onInvalid={() => this.toggleFormValid(false)}
          layout="vertical"
        >
          <div className="form-group">
            <Input
              autoFocus
              autoComplete="current-password"
              value={password}
              name="password"
              id="password-input"
              label={label}
              type="password"
              required
            />
          </div>

          <LoaderButton
            className="btn btn-success"
            formNoValidate
            type="submit"
            disabled={unlocking || !formIsValid}
            isLoading={unlocking}
            loadingText="Unlocking your wallet..."
          >
            <i className="fa fa-unlock" />
            {buttonText}
          </LoaderButton>

          {this.props.children}
        </Form>
      </span>
    );
  }
}

export default UnlockWalletForm;

UnlockWalletForm.propTypes = {
  submit: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  buttonText: PropTypes.string.isRequired,
  unlocking: PropTypes.bool.isRequired,
  children: PropTypes.element,
};

UnlockWalletForm.defaultProps = {
  error: '',
  children: <span />,
};
