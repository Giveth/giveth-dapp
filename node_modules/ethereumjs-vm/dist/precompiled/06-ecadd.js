'use strict';

var utils = require('ethereumjs-util');
var BN = utils.BN;
var error = require('../exceptions.js').ERROR;
var fees = require('ethereum-common');
var assert = require('assert');

var bn128Module = require('rustbn.js');
var ecAddPrecompile = bn128Module.cwrap('ec_add', 'string', ['string']);

module.exports = function (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;
  var inputHexStr = data.toString('hex');

  results.gasUsed = new BN(fees.ecAddGas.v);
  if (opts.gasLimit.lt(results.gasUsed)) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
    results.gasUsed = new BN(opts.gasLimit);
    results.exceptionError = error.OUT_OF_GAS;
    return results;
  }

  var returnData = ecAddPrecompile(inputHexStr);

  // check ecadd success or failure by comparing the output length
  if (returnData.length !== 128) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
    results.gasUsed = new BN(opts.gasLimit);
    results.exceptionError = error.OUT_OF_GAS;
  } else {
    results.return = Buffer.from(returnData, 'hex');
    results.exception = 1;
  }

  return results;
};