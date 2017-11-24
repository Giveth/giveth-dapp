import React from 'react';
import createReactClass from 'create-react-class';
import Formsy from 'formsy-react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import PropTypes from 'prop-types';
import 'react-datepicker/dist/react-datepicker.css';


const DatePickerFormsy = createReactClass({
  mixins: [Formsy.Mixin],

  getInitialState() {
    return { startDate: undefined };
  },

  handleChange(moment) {
    this.setState({ startDate: moment });
    this.props.changeDate(moment);
  },

  render() {
    // Set a specific className based on the validation
    // state of this component. showRequired() is true
    // when the value is empty and the required prop is
    // passed to the input. showError() is true when the
    // value typed is invalid
    const className = this.showRequired() ? 'required' : this.showError() ? 'error' : null;

    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = this.getErrorMessage();

    return (
      <div className={`form-group ${className}`}>
        <label>{this.props.label}</label>
        <DatePicker
          dateFormat="YYYY/MM/DD"
          name="description"
          tabIndex={2}
          minDate={moment()}
          selected={this.state.startDate}
          placeholderText={this.props.placeholder}
          onChange={this.handleChange}
          className="form-control"
        />
        <span>{errorMessage}</span>
      </div>
    );
  },
});

DatePickerFormsy.propTypes = {
  placeholder: PropTypes.string.isRequired,
};

export default DatePickerFormsy;
