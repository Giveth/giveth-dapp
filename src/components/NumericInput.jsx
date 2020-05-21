import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { Input } from 'formsy-react-components';

function NumericInput(props) {
  const { maxAmount, token, id, value, autoFocus, onChange } = props;
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
      onChange={onChange}
      validations={{
        lessOrEqualTo: maxAmount.toNumber(),
        greaterThan: 0,
        precision: decimals,
      }}
      validationErrors={{
        greaterThan: `Please enter value greater than 0 ${symbol}`,
        lessOrEqualTo: `This donation exceeds your wallet balance or the Milestone max amount: ${maxAmount.toFixed()} ${symbol}.`,
        precision: `This precision is not acceptable for ${symbol} token`,
      }}
    />
  );
}

NumericInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  token: PropTypes.instanceOf(Object).isRequired,
  maxAmount: PropTypes.instanceOf(BigNumber).isRequired,
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  autoFocus: PropTypes.bool,
};

NumericInput.defaultProps = {
  autoFocus: undefined,
};

export default NumericInput;
