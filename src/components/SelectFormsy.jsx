import React from 'react';
import PropTypes from 'prop-types';
import { withFormsy } from 'formsy-react';

class SelectFormsy extends React.Component {
  constructor(props) {
    super(props);

    this.changeValue = this.changeValue.bind(this);
  }

  changeValue(event) {
    this.props.setValue(event.currentTarget.value);
    this.props.onChange(event.currentTarget.value);
  }

  render() {
    let reqError = '';
    if (this.props.showRequired()) reqError = 'required';
    else if (this.props.showError()) reqError = 'error';

    const className = `form-group ${this.props.className} ${reqError}`;

    const errorMessage = this.props.getErrorMessage();

    const options = this.props.options.map(option => (
      <option
        key={option.title + option.value}
        value={option.value}
        disabled={
          this.props.allowedOptions &&
          !this.props.allowedOptions[
            option.value
          ] /* FIXME: This logic should probably be elsewhere, probably in the provider */
        }
      >
        {option.title}
      </option>
    ));

    if (this.props.cta) {
      options.unshift(
        <option key="cta" value="">
          {this.props.cta}
        </option>,
      );
    }

    return (
      <div className={`form-group ${className}`}>
        <label htmlFor={this.props.name}>
          {this.props.label} {this.props.isRequired() ? '*' : null}
          <select
            className="form-control"
            name={this.props.name}
            onChange={this.changeValue}
            value={this.props.getValue()}
            disabled={this.props.disabled}
          >
            {options}
          </select>
        </label>

        <p>{!errorMessage && <small className="help-block">{this.props.helpText}</small>}</p>

        {errorMessage && <span className="help-block validation-message">{errorMessage}</span>}
      </div>
    );
  }
}

SelectFormsy.propTypes = {
  // Formsy proptypes
  getValue: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  isRequired: PropTypes.func.isRequired,
  getErrorMessage: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showRequired: PropTypes.func.isRequired,

  helpText: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  allowedOptions: PropTypes.shape(),
  cta: PropTypes.string,
  className: PropTypes.string,
};

SelectFormsy.defaultProps = {
  helpText: '',
  name: '',
  disabled: false,
  onChange: () => {},
  label: '',
  className: '',
  allowedOptions: undefined,
  cta: undefined,
};

export default withFormsy(SelectFormsy);
