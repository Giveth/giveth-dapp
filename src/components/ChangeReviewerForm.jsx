import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'formsy-react-components';
import SelectFormsy from './SelectFormsy';

import LoaderButton from './LoaderButton';

class ChangeReviewerForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isValid: false,
    };
    this.toggleFormValid = this.toggleFormValid.bind(this);
  }

  toggleFormValid(state) {
    this.setState({ isValid: state });
  }

  submit(model) {
    this.props.submit(model);
  }

  render() {
    const { error, buttonText, loading, reviewers } = this.props;
    const { isValid } = this.state;
    return (
      <span>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form
          onSubmit={this.submit}
          onValid={() => this.toggleFormValid(true)}
          onInvalid={() => this.toggleFormValid(false)}
          layout="vertical"
        >
          <div className="form-group">
            <SelectFormsy
              name="reviewerAddress"
              id="reviewer-select"
              label="Select a reviewer"
              helpText="This person or smart contract will be reviewing your Campaign to increase trust for Givers."
              cta="--- Select a reviewer ---"
              options={reviewers}
              validations="isEtherAddress"
              validationErrors={{
                isEtherAddress: 'Please select a reviewer.',
              }}
              required
            />
          </div>

          <LoaderButton
            className="btn btn-success"
            formNoValidate
            type="submit"
            disabled={loading || !isValid}
            isLoading={loading}
            loadingText="Processing request..."
          >
            <i className="fa fa-unlock" />
            {buttonText}
          </LoaderButton>
        </Form>
      </span>
    );
  }
}

ChangeReviewerForm.propTypes = {
  submit: PropTypes.func.isRequired,
  error: PropTypes.string,
  buttonText: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  reviewers: PropTypes.arrayOf().isRequired,
};

ChangeReviewerForm.defaultProps = {
  error: '',
};

export default ChangeReviewerForm;
