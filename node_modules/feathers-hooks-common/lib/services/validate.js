'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (validator) {
  return function (context) {
    (0, _checkContext2.default)(context, 'before', ['create', 'update', 'patch'], 'validate');

    if (typeof validator !== 'function') {
      throw new errors.BadRequest('Expected validator function. (validate)');
    }

    var results = validator((0, _getItems2.default)(context), context);

    if (results && typeof results.then === 'function') {
      return results.then(function (convertedValues) {
        if (convertedValues) {
          // if values have been sanitized
          (0, _replaceItems2.default)(context, convertedValues);
        }

        return context;
      });
    }

    // Sync function returns errors. It cannot sanitize.
    if (results && Object.keys(results).length) {
      throw new errors.BadRequest({ errors: results });
    }

    return context;
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

var _replaceItems = require('./replace-items');

var _replaceItems2 = _interopRequireDefault(_replaceItems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];