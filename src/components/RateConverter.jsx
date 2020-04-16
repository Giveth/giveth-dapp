import React, { Component, Fragment } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import moment from 'moment';

import { Input } from 'formsy-react-components';
import SelectFormsy from './SelectFormsy';
import DatePickerFormsy from './DatePickerFormsy';
import Loader from './Loader';

import { getStartOfDayUTC } from '../lib/helpers';
import getConversionRatesContext from '../containers/getConversionRatesContext';

BigNumber.config({ DECIMAL_PLACES: 18 });

const numberRegex = RegExp('^[0-9]*[.]?[0-9]*$');

class RateConverter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
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

  componentDidMount() {
    this.setDate(this.props.date);
  }

  setDate(date) {
    this.setState({ date });
    const { getConversionRates, token } = this.props;

    getConversionRates(date, token.symbol).then(resp => {
      // Set rate, or if rate is undefined, use the first defined rate
      let rate = resp.rates[this.state.selectedFiatType];

      // This rate is undefined
      if (!rate) {
        rate = resp.rates[token.symbol];

        this.setState(prevState => ({
          conversionRate: resp,
          etherAmountForm: prevState.fiatAmountForm ? prevState.fiatAmount.div(rate).toFixed() : '',
          selectedFiatType: token.symbol,
          isLoading: false,
        }));
      } else {
        this.setState(prevState => ({
          conversionRate: resp,
          etherAmountForm: prevState.fiatAmountForm ? prevState.fiatAmount.div(rate).toFixed() : '',
          isLoading: false,
        }));
      }
    });
  }

  setEtherAmount(name, value) {
    if (numberRegex.test(value)) {
      const fiatAmount = new BigNumber(`0${value}`);
      const conversionRate = this.state.conversionRate.rates[this.state.selectedFiatType];

      if (conversionRate && fiatAmount.gte(0)) {
        this.setState({
          etherAmountForm: fiatAmount.div(conversionRate).toFixed(),
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
          fiatAmountForm: etherAmount.times(conversionRate).toFixed(),
          etherAmountForm: value,
        });
      }
    }
  }

  changeSelectedFiat(fiatType) {
    const conversionRate = this.state.conversionRate.rates[fiatType];
    this.setState(prevState => ({
      etherAmountForm: prevState.fiatAmount.div(conversionRate).toFixed(),
      selectedFiatType: fiatType,
    }));
  }

  render() {
    const { fiatTypes, token, conversionRateLoading } = this.props;
    const {
      date,
      selectedFiatType,
      fiatAmountForm,
      etherAmountForm,
      conversionRate,
      isLoading,
    } = this.state;

    return (
      <div>
        {isLoading && <Loader className="small" />}

        {!isLoading && (
          <Fragment>
            <div className="form-group row">
              {conversionRateLoading && <Loader />}

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
              <div className="col-5">
                <Input
                  type="text"
                  label={`Amount in ${selectedFiatType}`}
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

              <div className="col-2">
                <SelectFormsy
                  name="fiatType"
                  label="Currency"
                  value={selectedFiatType}
                  options={fiatTypes}
                  allowedOptions={conversionRate && conversionRate.rates}
                  onChange={this.changeSelectedFiat}
                  helpText={
                    !conversionRateLoading &&
                    conversionRate &&
                    conversionRate.rates &&
                    `1 ${token.symbol} = ${conversionRate.rates[selectedFiatType]} ${selectedFiatType}`
                  }
                  required
                  disabled={this.props.disabled}
                />
              </div>

              <div className="col-5">
                <Input
                  type="text"
                  label={`Amount in ${token.name}`}
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
                  conversionRate && conversionRate.rates
                    ? conversionRate.rates[selectedFiatType].toString()
                    : '0'
                }
              />
              <Input
                type="hidden"
                name="conversionRateTimestamp"
                value={
                  this.state.conversionRate ? this.state.conversionRate.timestamp.toString() : ''
                }
              />
            </div>
          </Fragment>
        )}
      </div>
    );
  }
}

RateConverter.propTypes = {
  getConversionRates: PropTypes.func.isRequired,
  conversionRateLoading: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  selectedFiatType: PropTypes.string,
  date: PropTypes.instanceOf(moment),
  fiatAmount: PropTypes.string,
  etherAmount: PropTypes.string,
  fiatTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  token: PropTypes.shape({
    symbol: PropTypes.string,
    name: PropTypes.string,
  }),
};

RateConverter.defaultProps = {
  disabled: false,
  selectedFiatType: 'EUR',
  date: getStartOfDayUTC().subtract(1, 'd'),
  fiatAmount: '',
  etherAmount: '',
  token: undefined,
};

export default getConversionRatesContext(RateConverter);
