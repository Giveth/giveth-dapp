import React from 'react';
import createReactClass from 'create-react-class';
import Formsy from 'formsy-react';

const SelectFormsy = createReactClass({
  mixins: [Formsy.Mixin],

  changeValue(event) {
    this.setValue(event.currentTarget.value);
  },

  render() {
    const className = 'form-group' + (this.props.className || ' ') +
      (this.showRequired() ? 'required' : this.showError() ? 'error' : '');
   
    
    const errorMessage = this.getErrorMessage();

    const options = this.props.options.map((option, i) => (
      <option key={option.title+option.value} value={option.value}>
        {option.title}
      </option>
    ));

    if(this.props.cta) {
      options.unshift(
        <option key="cta" value="">{this.props.cta}</option>
      )
    }

    return (
      <div className={`form-group ${className}`}>
        <label>
          {this.props.label} {this.isRequired() ? '*' : null}
        </label>
        <select 
          className="form-control" 
          name={this.props.name} 
          onChange={this.changeValue} 
          value={this.getValue()}
          defaultValue={this.getValue()}
          disabled={this.props.disabled}
        >
          {options}
        </select>

        {!errorMessage &&
          <small className="help-block">{this.props.helpText}</small>                
        }

        {errorMessage &&
          <span className="help-block validation-message">{errorMessage}</span>
        }
      </div>
    );
  }

});

export default SelectFormsy;