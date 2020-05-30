import { addValidationRule } from 'formsy-react';
import moment from 'moment';
import Web3 from 'web3';

// Formsy validations

// Greater than number
addValidationRule('greaterThan', (formValues, inputValue, value) => parseFloat(inputValue) > value);

// Less than number
addValidationRule('lessThan', (formValues, inputValue, value) =>
  inputValue ? parseFloat(inputValue) < value : true,
);

// Less or equal to number
addValidationRule('lessOrEqualTo', (formValues, inputValue, value) =>
  inputValue ? parseFloat(inputValue) <= value : true,
);

// Greater than number
addValidationRule(
  'greaterEqualTo',
  (formValues, inputValue, value) => parseFloat(inputValue) >= value,
);

addValidationRule('isMoment', (formValues, inputValue) => moment.isMoment(inputValue));

// Checks if input is a valid Ether address
// TODO: Does not support ENS! (It's hard, ENS returns promises)
addValidationRule(
  'isEtherAddress',
  (formValues, inputValue, _value) => !inputValue || Web3.utils.isAddress(inputValue),
);

addValidationRule(
  'isNumber',
  (formValues, inputValue, _value) => !inputValue || /^\d+$/.test(inputValue),
);

addValidationRule('precision', (formValue, inputValue, precision) => {
  if (!inputValue) return true;
  const regex = new RegExp(`^\\d*(\\.\\d{1,${precision}})?$`);
  return regex.test(inputValue);
});
