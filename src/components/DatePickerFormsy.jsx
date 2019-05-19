import React from 'react';
import { withFormsy } from 'formsy-react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import PropTypes from 'prop-types';
import 'react-datepicker/dist/react-datepicker.css';

import { getStartOfDayUTC } from '../lib/helpers';

class DatePickerFormsy extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.props.setValue(getStartOfDayUTC().subtract(1, 'd'));
  }

  handleChange(m) {
    this.props.setValue(getStartOfDayUTC(m));
    this.props.changeDate(getStartOfDayUTC(m));
  }

  render() {
    // Set a specific className based on the validation
    // state of this component. showRequired() is true
    // when the value is empty and the required prop is
    // passed to the input. showError() is true when the
    // value typed is invalid
    let reqError = '';
    if (this.props.showRequired()) reqError = 'required';
    else if (this.props.showError()) reqError = 'error';

    const className = `form-group ${this.props.className} ${reqError}`;

    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = this.props.getErrorMessage();

    return (
      <div className={`form-group ${className}`}>
        <label htmlFor="datePicker">
          {this.props.label}
          <DatePicker
            id="datePicker"
            dateFormat="YYYY/MM/DD"
            name="description"
            selected={
              this.props.startDate || this.props.getValue() || getStartOfDayUTC().subtract(1, 'd')
            }
            placeholderText={this.props.placeholder}
            onChange={this.handleChange}
            onChangeRaw={this.handleRaw}
            className="form-control"
            disabled={this.props.disabled}
            minDate={getStartOfDayUTC(moment('2017-01-01', 'YYYY-MM-DD'))}
            maxDate={getStartOfDayUTC().subtract(1, 'd')}
            shouldCloseOnSelect
            readOnly
          />
        </label>
        <span>{errorMessage}</span>
      </div>
    );
  }
}

DatePickerFormsy.propTypes = {
  // Formsy proptypes
  getValue: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  getErrorMessage: PropTypes.func.isRequired,
  showRequired: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  startDate: PropTypes.shape({}),

  changeDate: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

DatePickerFormsy.defaultProps = {
  label: undefined,
  className: undefined,
  placeholder: undefined,
  disabled: false,
  startDate: undefined,
};

export default withFormsy(DatePickerFormsy);
