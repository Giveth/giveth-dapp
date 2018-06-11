'use strict';

var utils = require('ethereumjs-util');
var BN = utils.BN;
var error = require('../exceptions.js').ERROR;
var fees = require('ethereum-common');
var assert = require('assert');

module.exports = function (opts) {
  assert(opts.data);

  var results = {};
  var data = opts.data;

  results.gasUsed = new BN(fees.ripemd160Gas.v);
  results.gasUsed.iadd(new BN(fees.ripemd160WordGas.v).imuln(Math.ceil(data.length / 32)));

  if (opts.gasLimit.lt(results.gasUsed)) {
    results.gasUsed = opts.gasLimit;
    results.exceptionError = error.OUT_OF_GAS;
    results.exception = 0; // 0 means VM fail (in this case because of OOG)
    return results;
  }

  results.return = utils.ripemd160(data, true);
  results.exception = 1;

  return results;
};