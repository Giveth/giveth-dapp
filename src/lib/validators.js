import Formsy from 'formsy-react'
import Web3 from 'web3'

// Formsy validations

// Greater than number
Formsy.addValidationRule('greaterThan', function (formValues, inputValue, value) {
  return parseFloat(inputValue) > value;
});

// Less than number
Formsy.addValidationRule('lessThan', function (formValues, inputValue, value) {
  return parseFloat(inputValue) < value;
});

// Checks if input is a valid Ether address
// TO DO: Does not support ENS! (It's hard, ENS returns promises)
Formsy.addValidationRule('isEtherAddress', function (formValues, inputValue, value) {
  return  Web3.utils.isAddress(inputValue)
});