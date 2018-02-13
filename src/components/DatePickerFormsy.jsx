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
    return { 
      startDate: this.props.startDate
    };
  },

  componentDidMount(){
    this.setState({ _isValid: true })    
    this.setValue(moment(this.props.startDate).format("YYYY/MM/DD"));
  },

  handleChange(m) {
    this.setState({ startDate: m });
    this.props.changeDate(m);
  },

  render() {
    // Set a specific className based on the validation
    // state of this component. showRequired() is true
    // when the value is empty and the required prop is
    // passed to the input. showError() is true when the
    // value typed is invalid
    const className = 'form-group' + (this.props.className || ' ') +
      (this.showRequired() ? 'required' : this.showError() ? 'error' : '');

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
          selected={this.state.startDate}
          placeholderText={this.props.placeholder}
          onChange={this.handleChange}
          onChangeRaw={this.handleRaw}
          className="form-control"
          disabled={this.props.disabled}
          maxDate={moment().subtract(1, 'd')}
          readOnly={true}
        />
        <span>{errorMessage}</span>
      </div>
    );
  },
});

DatePickerFormsy.propTypes = {
  placeholder: PropTypes.string.isRequired,
  changeDate: PropTypes.func.isRequired,
  startDate: PropTypes.object.isRequired,
  label: PropTypes.string,
};

export default DatePickerFormsy;
