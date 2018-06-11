'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, providers = Array(_len), _key = 0; _key < _len; _key++) {
    providers[_key] = arguments[_key];
  }

  if (!providers.length) {
    throw new errors.MethodNotAllowed('Calling iff() predicate incorrectly. (isProvider)');
  }

  return function (hook) {
    var hookProvider = (hook.params || {}).provider;

    return providers.some(function (provider) {
      return provider === hookProvider || provider === 'server' && !hookProvider || provider === 'external' && hookProvider;
    });
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];