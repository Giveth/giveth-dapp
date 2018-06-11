'use strict';

var utils = require('ethereumjs-util');
var ERROR = require('../exceptions.js').ERROR;
var BN = utils.BN;
var fees = require('ethereum-common');
var assert = require('assert');

var bn128Module = require('rustbn.js');
var ecMulPrecompile = bn128Module.cwrap('ec_mul', 'string', ['string']);

module.exports = function (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  var inputHexStr = data.toString('hex');
  results.gasUsed = new BN(fees.ecMulGas.v);

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
    results.gasUsed = new BN(opts.gasLimit);
    results.exceptionError = ERROR.OUT_OF_GAS;
    return results;
  }

  var returnData = ecMulPrecompile(inputHexStr);

  // check ecmul success or failure by comparing the output length
  if (returnData.length !== 128) {
    results.return = Buffer.alloc(0);
    results.exception = 0;
  } else {
    results.return = Buffer.from(returnData, 'hex');
    results.exception = 1;
  }

  return results;
};