import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SkyLightStateless } from 'react-skylight';
import { Form, Input } from 'formsy-react-components';
import Formsy from 'formsy-react';
import SelectFormsy from './SelectFormsy';
import DatePickerFormsy from './DatePickerFormsy';
import FormsyImageUploader from './FormsyImageUploader';
import moment from 'moment'
import { Portal } from 'react-portal';

Formsy.addValidationRule('isMoment', function (values, value, array) {
  return value.isMoment();
});


class AddMilestoneItem extends Component {
  constructor() {
    super();

    this.state = {
      modalVisible: false,
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
      uploadNewImage: false,
      formIsValid: false      
    }

    this.setImage = this.setImage.bind(this);   
    this.save = this.save.bind(this);     
  }

  openDialog() {
    this.setState({ modalVisible: true })
  }

  closeDialog() {
    this.setState({ modalVisible: false })
  }  

  save() {
    this.setState({ modalVisible: false });
    this.props.onAddItem(this.refs.itemForm.getModel());
  }


  setImage(image) {
    this.setState({ image, uploadNewImage: true });
  }

  setDate(moment) {
    this.setState({ date: moment });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }  

  mapInputs(inputs) {
    return {
      date: this.state.date.format(),
      description: inputs.description,
      selectedFiatType: this.state.selectedFiatType,
      fiatAmount: inputs.fiatAmount,
      etherAmount: inputs.etherAmount,
      image: this.state.image
    }    
  }

  render() {
    const { 
      modalVisible, 
      formIsValid, 
      date, 
      description, 
      fiatTypes, 
      selectedFiatType, 
      fiatAmount, 
      etherAmount 
    } = this.state;

    return (
      <span>
        <button className="btn btn-primary btn-sm" onClick={()=>this.openDialog()}>
          Add item
        </button>

        <Portal>

          <SkyLightStateless
            isVisible={this.state.modalVisible}
            onCloseClicked={() => this.closeDialog()}
            title={`Add an item to this milestone`}
          >   

            <Formsy.Form
              mapping={inputs => this.mapInputs(inputs)}
              onValid={() => this.toggleFormValid(true)}
              onInvalid={() => this.toggleFormValid(false)}
              ref="itemForm"
            > 

              <DatePickerFormsy
                name="date"
                type="text"
                value={date}
                startDate={date}
                changeDate={date => this.setDate(date)}
                placeholder="Select a date"
                help="Select a date"
                validations="minLength:8"
                validationErrors={{
                  minLength: 'Please provide a date.',
                }}
                required
              />

              <Input
                name="description"
                type="text"
                value={description}
                placeholder="E.g. my receipt"
                validations="minLength:3"
                validationErrors={{
                  minLength: 'Provide description',
                }}
                required
                autoFocus                
              />     
              
              <SelectFormsy
                name="fiatType"
                value={selectedFiatType}
                options={fiatTypes}
                required
              />  
              
              <Input
                name="fiatAmount"
                type="number"
                value={fiatAmount}
                placeholder="10"
                validations="greaterThan:0"
                validationErrors={{
                  greaterThan: 'Enter value',
                }}
                required
              />  

              <Input
                name="etherAmount"
                type="number"
                value={etherAmount}
                placeholder="10"
                validations="greaterThan:0"
                validationErrors={{
                  greaterThan: 'Enter value',
                }}
                required
              />                                   

              <FormsyImageUploader
                name="image"
                setImage={this.setImage}
              /> 

              <button 
                className="btn btn-primary" 
                onClick={()=>this.save()}
                disabled={!formIsValid}
                formNoValidate      
                type="submit"        
              >
                Add item
              </button>        

              <button 
                className="btn btn-link" 
                onClick={()=>this.closeDialog()}
              >
                Cancel
              </button> 

            </Formsy.Form>           
          </SkyLightStateless>   
        </Portal> 
      </span>
    )
  }
}

export default AddMilestoneItem;