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

const initialState = {
  modalVisible: false,
  date: moment(),
  fiatTypes: [
    {value: 'USD', title: 'USD'},
    {value: 'EUR', title: 'EUR'},
    {value: 'GBP', title: 'GBP'},
    {value: 'CHF', title: 'CHF'},
    {value: 'MXN', title: 'MXN'},
    {value: 'THB', title: 'THB'}
  ],
  description: '',
  selectedFiatType: 'EUR',
  fiatAmount: 1,
  etherAmount: 0,
  image: '',
  uploadNewImage: false,
  formIsValid: false
}


class AddMilestoneItem extends Component {
  constructor() {
    super();

    this.state = initialState;

    this.setImage = this.setImage.bind(this);   
    this.save = this.save.bind(this);  
    this.setEtherAmount = this.setEtherAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);   
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
  }

  openDialog() {
    this.setState({ 
      modalVisible: true, 
      conversionRate: this.props.conversionRate,
      etherAmount: this.state.fiatAmount / this.props.conversionRate.rates[this.state.selectedFiatType] 
    })
  }

  closeDialog() {
    this.setState(initialState)
  }  

  save() {
    // this.setState({ modalVisible: false });
    this.props.onAddItem(this.refs.itemForm.getModel());
    this.setState(initialState)
  }


  setImage(image) {
    this.setState({ image, uploadNewImage: true });
  }

  setDate(moment) {
    this.setState({ date: moment });
    this.props.getEthConversion(moment).then((resp) => {
      // update all the input fields
      const rate = resp.rates[this.state.selectedFiatType];

      this.setState({ 
        conversionRate: resp,
        etherAmount: this.state.fiatAmount / rate
      })
    });
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }  

  mapInputs(inputs) {
    return {
      date: this.state.date.format(),
      description: inputs.description,
      selectedFiatType: this.state.selectedFiatType,
      fiatAmount: this.state.fiatAmount,
      etherAmount: this.state.etherAmount,
      image: this.state.image,
      ethConversionRateTimestamp: this.state.conversionRate.timestamp
    }    
  }

  setEtherAmount(e) {
    const fiatAmount = parseFloat(this.refs.fiatAmount.getValue())
    const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

    if(conversionRate && fiatAmount >= 0) {
      this.setState({ 
        etherAmount: fiatAmount / conversionRate,
        fiatAmount: fiatAmount
      })
    }
  }

  setFiatAmount(e) {
    const etherAmount = parseFloat(this.refs.etherAmount.getValue())
    const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

    if(conversionRate && etherAmount >= 0) {
      this.setState({ 
        fiatAmount: etherAmount * conversionRate,
        etherAmount: etherAmount
      })
    }
  }  

  changeSelectedFiat(fiatType) {
    const conversionRate = this.state.conversionRate.rates[fiatType];
    this.setState({ 
      etherAmount: this.state.fiatAmount / conversionRate,
      selectedFiatType: fiatType
    })    
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
      etherAmount,
      image 
    } = this.state;

    return (
      <span>
        <a className="btn btn-primary btn-sm" onClick={()=>this.openDialog()}>
          Add item
        </a>

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
                label="description"
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
                onChange={this.changeSelectedFiat}
                required
              />  
              
              <Input
                label="Amount in fiat"
                name="fiatAmount"
                ref="fiatAmount"
                type="number"
                value={fiatAmount}
                placeholder="10"
                validations="greaterThan:0"
                validationErrors={{
                  greaterThan: 'Enter value',
                }}
                onKeyUp={this.setEtherAmount}                
                required
              />  

              <Input
                label="Amount in ether" 
                ref="etherAmount"             
                name="etherAmount"
                type="number"
                value={etherAmount}
                placeholder="10"
                validations="greaterThan:0"
                validationErrors={{
                  greaterThan: 'Enter value',
                }}
                onKeyUp={this.setFiatAmount}                
                required
              />                                   

              <FormsyImageUploader
                name="image"
                // previewImage={image}
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