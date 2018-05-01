import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import moment from 'moment';

import { Input } from 'formsy-react-components';
import SelectFormsy from './SelectFormsy';
import DatePickerFormsy from './DatePickerFormsy';

import { getStartOfDayUTC } from '../lib/helpers';

BigNumber.config({ DECIMAL_PLACES: 18 });

const fiatTypes = [
  { value: 'BRL', title: 'BRL' },
  { value: 'CHF', title: 'CHF' },
  { value: 'CZK', title: 'CZK' },
  { value: 'ETH', title: 'ETH' },
  { value: 'EUR', title: 'EUR' },
  { value: 'GBP', title: 'GBP' },
  { value: 'MXN', title: 'MXN' },
  { value: 'THB', title: 'THB' },
  { value: 'USD', title: 'USD' },
];

const numberRegex = RegExp('^[0-9]*[.]?[0-9]*$');

class RateConvertor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      date: props.date,
      selectedFiatType: props.selectedFiatType,
      fiatAmount: new BigNumber(`0${props.fiatAmount}`),
      fiatAmountForm: props.fiatAmount,
      etherAmountForm: props.etherAmount,
    };

    this.setEtherAmount = this.setEtherAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
  }

  componentWillMount() {
    this.props
      .getEthConversion(this.state.date)
      .then(resp => this.setState({ conversionRate: resp }));
  }

  setDate(date) {
    this.setState({ date });
    this.props.getEthConversion(date).then(resp => {
      // update all the input fields
      const rate = resp.rates[this.state.selectedFiatType];

      this.setState({
        conversionRate: resp,
        etherAmountForm: this.state.fiatAmountForm
          ? this.state.fiatAmount.div(rate).toString()
          : '',
      });
    });
  }

  setEtherAmount(name, value) {
    if (numberRegex.test(value)) {
      const fiatAmount = new BigNumber(`0${value}`);
      const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

      if (conversionRate && fiatAmount.gte(0)) {
        this.setState({
          etherAmountForm: fiatAmount.div(conversionRate).toString(),
          fiatAmount,
          fiatAmountForm: value,
        });
      }
    }
  }

  setFiatAmount(name, value) {
    if (numberRegex.test(value)) {
      const etherAmount = new BigNumber(`0${value}`);
      const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

      if (conversionRate && etherAmount.gte(0)) {
        this.setState({
          fiatAmount: etherAmount.times(conversionRate),
          fiatAmountForm: etherAmount.times(conversionRate).toString(),
          etherAmountForm: value,
        });
      }
    }
  }

  changeSelectedFiat(fiatType) {
    const conversionRate = this.state.conversionRate.rates[fiatType];
    this.setState({
      etherAmountForm: this.state.fiatAmount.div(conversionRate).toString(),
      selectedFiatType: fiatType,
    });
  }

  render() {
    const { date, selectedFiatType, fiatAmountForm, etherAmountForm, conversionRate } = this.state;

    return (
      <div>
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
              disabled={this.props.disabled}
            />
          </div>
        </div>

        <div className="form-group row">
          <div className="col-4">
            <Input
              type="text"
              label="Amount in fiat"
              name="fiatAmount"
              value={fiatAmountForm}
              validations="greaterThan:0,isNumeric"
              validationErrors={{
                greaterThan: 'Enter value',
                isNumeric: 'Provide correct number',
              }}
              onChange={this.setEtherAmount}
              required
              disabled={this.props.disabled}
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
              disabled={this.props.disabled}
            />
          </div>

          <div className="col-4">
            <Input
              type="text"
              label="Amount in ether"
              name="etherAmount"
              value={etherAmountForm}
              validations="greaterThan:0,isNumeric"
              validationErrors={{
                greaterThan: 'Enter value',
                isNumeric: 'Provide correct number',
              }}
              onChange={this.setFiatAmount}
              required
              disabled={this.props.disabled}
            />
          </div>
          <Input
            type="hidden"
            name="conversionRate"
            value={
              this.state.conversionRate && this.state.conversionRate.rates
                ? this.state.conversionRate.rates[this.state.selectedFiatType].toString()
                : '0'
            }
          />
          <Input
            type="hidden"
            name="ethConversionRateTimestamp"
            value={this.state.conversionRate ? this.state.conversionRate.timestamp.toString() : ''}
          />
        </div>
      </div>
    );
  }
}

RateConvertor.propTypes = {
  getEthConversion: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  selectedFiatType: PropTypes.string,
  date: PropTypes.instanceOf(moment),
  fiatAmount: PropTypes.string,
  etherAmount: PropTypes.string,
};

RateConvertor.defaultProps = {
  disabled: false,
  selectedFiatType: 'EUR',
  date: getStartOfDayUTC().subtract(1, 'd'),
  fiatAmount: '',
  etherAmount: '',
};

export default RateConvertor;
