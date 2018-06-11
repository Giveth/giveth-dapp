'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (predicate) {
  if (typeof predicate !== 'function') {
    throw new errors.MethodNotAllowed('Expected function as param. (isNot)');
  }

  return function (hook) {
    var result = predicate(hook); // Should we pass a clone? (safety vs performance)

    if (!result || typeof result.then !== 'function') {
      return !result;
    }

    return result.then(function (result1) {
      return !result1;
    });
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];