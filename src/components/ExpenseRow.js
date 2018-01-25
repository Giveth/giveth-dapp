import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'formsy-react-components';
import SelectFormsy from './SelectFormsy';
import DatePickerFormsy from './DatePickerFormsy';
import FormsyImageUploader from './FormsyImageUploader';
import moment from 'moment';

class ExpenseRow extends Component {
  constructor() {
    super();

    this.state = {
      date: moment(),
      fiatTypes: [
        {value: 'USD', title: 'USD'},
        {value: 'EUR', title: 'EUR'},
        {value: 'POUND', title: 'POUND'}
      ],
      description: '',
      selectedFiatType: 'EUR',
      fiatAmount: 0,
      etherAmount: 0,
      image: '',
      uploadNewImage: false
    }

    this.setImage = this.setImage.bind(this);
  }

  setImage(image) {
    this.setState({ image, uploadNewImage: true });
  }

  setDate(moment) {
    this.setState({ completionDeadline: moment.format('YYYY/MM/DD') });
  }

  render(){
    const { isNew, isProposed, removeExpense, index } = this.props;
    const { date, description, fiatTypes, selectedFiatType, fiatAmount, etherAmount } = this.state;

    return(
      <tr>
        <td className="td-expense-date">
        {/*
          <DatePickerFormsy
            name="date"
            type="text"
            value={date}
            changeDate={date => this.setDate(date)}
            placeholder="Select a date"
            help="Select a date"
            validations="minLength:10"
            validationErrors={{
              minLength: 'Please provide a date.',
            }}
            // required
          />
          */}
        </td>


        <td className="td-expense-description">
          <Input
            name={`description-${index}`}
            type="text"
            value={description}
            placeholder="E.g. my receipt"
            validations="minLength:3"
            validationErrors={{
              minLength: 'Provide description',
            }}
            required
            disabled={!isNew && !isProposed}            
          />  
        </td>

        <td className="td-expense-fiat-type">
          <SelectFormsy
            name={`fiatType-${index}`}
            value={selectedFiatType}
            options={fiatTypes}
            required
            disabled={!isNew && !isProposed}
          />
        </td>           

        <td className="td-expense-fiat-amount">
          <Input
            name={`fiatAmount-${index}`}
            type="number"
            value={fiatAmount}
            placeholder="10"
            validations="greaterThan:0"
            validationErrors={{
              greaterThan: 'Enter value',
            }}
            required
            disabled={!isNew && !isProposed}                        
          />        
        </td> 

        <td className="td-expense-ether-amount">
          <Input
            name={`etherAmount-${index}`}
            type="number"
            value={etherAmount}
            placeholder="10"
            validations="greaterThan:0"
            validationErrors={{
              greaterThan: 'Enter value',
            }}
            required
            disabled={!isNew && !isProposed}                        
          />          
        </td> 

        <td className="td-expense-file-upload">
          <FormsyImageUploader
            name={`image-${index}`}
            setImage={this.setImage}
            disabled={!isNew && !isProposed}                        
          />        
        </td> 

        <td className="td-expense-remove">
          <button className="btn btn-danger" onClick={removeExpense}>
            X
          </button>
        </td>         
      </tr>
    )
  }
}

export default ExpenseRow;