import Formsy from 'formsy-react';
import Web3 from 'web3';

// Formsy validations

// Greater than number
Formsy.addValidationRule(
  'greaterThan',
  (formValues, inputValue, value) => parseFloat(inputValue) > value,
);

// Less than number
Formsy.addValidationRule(
  'lessThan',
  (formValues, inputValue, value) => parseFloat(inputValue) < value,
);

// Greater than number
Formsy.addValidationRule(
  'greaterEqualTo',
  (formValues, inputValue, value) => parseFloat(inputValue) >= value,
);

// Checks if input is a valid Ether address
// TODO: Does not support ENS! (It's hard, ENS returns promises)
Formsy.addValidationRule('isEtherAddress', (formValues, inputValue, _value) =>
  Web3.utils.isAddress(inputValue),
);
