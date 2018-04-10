import React, { Component } from 'react';
import { Portal } from 'react-portal';
import { utils } from 'web3';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import { SkyLightStateless } from 'react-skylight';
import { Input, Form } from 'formsy-react-components';
import SelectFormsy from './SelectFormsy';
import DatePickerFormsy from './DatePickerFormsy';
import FormsyImageUploader from './FormsyImageUploader';

import { getStartOfDayUTC } from '../lib/helpers';

BigNumber.config({ DECIMAL_PLACES: 1 });

const initialState = {
  modalVisible: false,
  date: getStartOfDayUTC().subtract(1, 'd'),
  description: '',
  selectedFiatType: 'EUR',
  fiatAmount: new BigNumber(0),
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
    this.submit = this.submit.bind(this);
    this.setEtherAmount = this.setEtherAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
    this.openDialog = this.openDialog.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentWillMount() {
    this.props
      .getEthConversion(this.state.date)
      .then(resp => this.setState({ conversionRate: resp }));
  }

  setImage(image) {
    this.setState({ image });
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

  closeDialog() {
    this.setState(initialState);
  }

  submit(model) {
    this.props.onAddItem(model);
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
        <button className="btn btn-primary btn-sm btn-add-milestone-item" onClick={this.openDialog}>
          Add item
        </button>

        <Portal className="add-milestone-item-skylight">
          <SkyLightStateless
            isVisible={modalVisible}
            onCloseClicked={() => this.closeDialog()}
            title="Add an item to this milestone"
            dialogStyles={addMilestoneModalStyle}
          >
            <Form
              onSubmit={this.submit}
              mapping={inputs => this.mapInputs(inputs)}
              onValid={() => this.setState({ formIsValid: true })}
              onInvalid={() => this.setState({ formIsValid: false })}
              layout="vertical"
            >
              <div className="form-group row">
                <div className="col-12">
                  <DatePickerFormsy
                    label="Date of item"
                    name="date"
                    type="text"
                    value={date}
                    startDate={date}
                    changeDate={dt => this.setDate(getStartOfDayUTC(dt))}
                    placeholder="Select a date"
                    help="Select a date"
                    validations="isMoment"
                    validationErrors={{
                      isMoment: 'Please provide a date.',
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group row">
                <div className="col-12">
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
                </div>
              </div>

              <div className="form-group row">
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
                    label="Currency"
                    value={selectedFiatType}
                    options={fiatTypes}
                    onChange={this.changeSelectedFiat}
                    helpText={
                      conversionRate &&
                      conversionRate.rates &&
                      `1 Eth = ${conversionRate.rates[selectedFiatType]} ${selectedFiatType}`
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
                disabled={!formIsValid}
                formNoValidate
                type="submit"
              >
                Add item
              </button>

              <button className="btn btn-link" onClick={() => this.closeDialog()}>
                Cancel
              </button>
            </Form>
          </SkyLightStateless>
        </Portal>
      </div>
    );
  }
}

AddMilestoneItem.propTypes = {
  getEthConversion: PropTypes.func.isRequired,
  onAddItem: PropTypes.func,
  fiatTypes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

AddMilestoneItem.defaultProps = {
  onAddItem: () => {},
};

export default AddMilestoneItem;
