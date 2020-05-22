import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { Input } from 'formsy-react-components';

const NumericInput = props => {
  const { maxAmount, token, id, value, autoFocus, onChange, lteMessage } = props;
  const { symbol, decimals } = token;
  return (
    <Input
      id={id}
      value={value}
      autoFocus={!!autoFocus}
      type="number"
      name="amount"
      min={0}
      max={maxAmount.decimalPlaces(Number(decimals), BigNumber.ROUND_DOWN).toNumber()}
      step={maxAmount
        .div(10)
        .decimalPlaces(Number(decimals), BigNumber.ROUND_DOWN)
        .toNumber()}
      onChange={(name, amount) => onChange(amount)}
      validations={{
        lessOrEqualTo: maxAmount.toNumber(),
        greaterThan: 0,
        precision: decimals,
      }}
      validationErrors={{
        greaterThan: `Please enter value greater than 0 ${symbol}`,
        lessOrEqualTo: lteMessage,
        precision: `This precision is not acceptable for ${symbol} token`,
      }}
      validatePristine
    />
  );
};

NumericInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  token: PropTypes.instanceOf(Object).isRequired,
  maxAmount: PropTypes.instanceOf(BigNumber).isRequired,
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  autoFocus: PropTypes.bool,
  lteMessage: PropTypes.string.isRequired,
};

NumericInput.defaultProps = {
  autoFocus: undefined,
};

export default NumericInput;
