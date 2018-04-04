import React, { Component } from 'react';
import { Portal } from 'react-portal';
import { utils } from 'web3';

import { SkyLightStateless } from 'react-skylight';
import { Input } from 'formsy-react-components';
import Formsy from 'formsy-react';
import SelectFormsy from './SelectFormsy';
import DatePickerFormsy from './DatePickerFormsy';
import FormsyImageUploader from './FormsyImageUploader';

import { getStartOfDayUTC } from '../lib/helpers';

const BigNumber = require('bignumber.js');

BigNumber.config({ DECIMAL_PLACES: 1 });

Formsy.addValidationRule('isMoment', (values, value) => value.isMoment());

const initialState = {
  modalVisible: false,
  date: getStartOfDayUTC().subtract(1, 'd'),
  description: '',
  selectedFiatType: 'EUR',
  fiatAmount: new BigNumber(1),
  etherAmount: new BigNumber(0),
  image: '',
  uploadNewImage: false,
  formIsValid: false,
};

const addMilestoneModalStyle = {
  width: '70% !important',
  height: '700px !important',
  marginTop: '-350px',
  maxHeight: '700px',
  overflowY: 'scroll',
  textAlign: 'left',
};

class AddMilestoneItem extends Component {
  constructor() {
    super();

    this.state = initialState;

    this.setImage = this.setImage.bind(this);
    this.save = this.save.bind(this);
    this.setEtherAmount = this.setEtherAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
    this.openDialog = this.openDialog.bind(this);
  }

  componentWillMount() {
    this.props
      .getEthConversion(this.state.date)
      .then(resp => this.setState({ conversionRate: resp }));
  }

  setImage(image) {
    this.setState({ image, uploadNewImage: true });
  }

  setDate(date) {
    this.setState({ date });
    this.props.getEthConversion(date).then(resp => {
      // update all the input fields
      const rate = resp.rates[this.state.selectedFiatType];

      this.setState({
        conversionRate: resp,
        etherAmount: this.state.fiatAmount.div(rate),
      });
    });
  }

  mapInputs(inputs) {
    return {
      date: this.state.date.format(),
      description: inputs.description,
      selectedFiatType: this.state.selectedFiatType,
      fiatAmount: this.state.fiatAmount.toFixed(),
      etherAmount: this.state.etherAmount.toFixed(18),
      wei: utils.toWei(this.state.etherAmount.toFixed(18)),
      conversionRate: this.state.conversionRate.rates[this.state.selectedFiatType],
      image: this.state.image,
      ethConversionRateTimestamp: this.state.conversionRate.timestamp,
    };
  }

  setEtherAmount(name, value) {
    const fiatAmount = new BigNumber(value || '0');
    const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

    if (conversionRate && fiatAmount.gte(0)) {
      this.setState({
        etherAmount: fiatAmount.div(conversionRate),
        fiatAmount,
      });
    }
  }

  setFiatAmount(name, value) {
    const etherAmount = new BigNumber(value || '0');
    const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

    if (conversionRate && etherAmount.gte(0)) {
      this.setState({
        fiatAmount: etherAmount.times(conversionRate),
        etherAmount,
      });
    }
  }

  closeDialog() {
    this.setState(initialState);
  }

  save() {
    this.props.onAddItem(this.refs.itemForm.getModel());
    this.setState(initialState);
  }

  openDialog() {
    this.props.getEthConversion(this.state.date).then(resp =>
      this.setState({
        modalVisible: true,
        conversionRate: resp,
        etherAmount: this.state.fiatAmount.div(resp.rates[this.state.selectedFiatType]),
      }),
    );
  }

  changeSelectedFiat(fiatType) {
    const conversionRate = this.state.conversionRate.rates[fiatType];
    this.setState({
      etherAmount: this.state.fiatAmount.div(conversionRate),
      selectedFiatType: fiatType,
    });
  }

  render() {
    const {
      modalVisible,
      formIsValid,
      date,
      description,
      selectedFiatType,
      fiatAmount,
      etherAmount,
      image,
      conversionRate,
    } = this.state;

    const { fiatTypes } = this.props;

    return (
      <div className="add-milestone-item">
        <a className="btn btn-primary btn-sm btn-add-milestone-item" onClick={this.openDialog}>
          Add item
        </a>

        <Portal className="add-milestone-item-skylight">
          <SkyLightStateless
            isVisible={modalVisible}
            onCloseClicked={() => this.closeDialog()}
            title="Add an item to this milestone"
            dialogStyles={addMilestoneModalStyle}
          >
            <Formsy.Form
              mapping={inputs => this.mapInputs(inputs)}
              onValid={() => this.setState({ formIsValid: true })}
              onInvalid={() => this.setState({ formIsValid: false })}
              ref="itemForm"
            >
              <DatePickerFormsy
                label="Date of item"
                name="date"
                type="text"
                value={date}
                startDate={date}
                changeDate={dt => this.setDate(getStartOfDayUTC(dt))}
                placeholder="Select a date"
                help="Select a date"
                validations="minLength:8"
                validationErrors={{
                  minLength: 'Please provide a date.',
                }}
                required
              />

              <Input
                label="Description"
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

              <div className="row">
                <div className="col-4">
                  <Input
                    min="0"
                    label="Amount in fiat"
                    name="fiatAmount"
                    type="number"
                    value={fiatAmount}
                    placeholder="10"
                    validations="greaterThan:0"
                    validationErrors={{
                      greaterThan: 'Enter value',
                    }}
                    onChange={this.setEtherAmount}
                    required
                  />
                </div>

                <div className="col-4">
                  <SelectFormsy
                    name="fiatType"
                    value={selectedFiatType}
                    options={fiatTypes}
                    onChange={this.changeSelectedFiat}
                    helpText={
                      conversionRate && conversionRate.rates
                        ? `1 Eth = ${conversionRate.rates[selectedFiatType]} ${selectedFiatType}`
                        : ''
                    }
                    required
                  />
                </div>

                <div className="col-4">
                  <Input
                    min="0"
                    label="Amount in ether"
                    name="etherAmount"
                    type="number"
                    value={etherAmount}
                    placeholder="10"
                    validations="greaterThan:0"
                    validationErrors={{
                      greaterThan: 'Enter value',
                    }}
                    onChange={this.setFiatAmount}
                    required
                  />
                </div>
              </div>

              <FormsyImageUploader name="image" previewImage={image} setImage={this.setImage} />

              <button
                className="btn btn-primary"
                onClick={() => this.save()}
                disabled={!formIsValid}
                formNoValidate
                type="submit"
              >
                Add item
              </button>

              <button className="btn btn-link" onClick={() => this.closeDialog()}>
                Cancel
              </button>
            </Formsy.Form>
          </SkyLightStateless>
        </Portal>
      </div>
    );
  }
}

export default AddMilestoneItem;
