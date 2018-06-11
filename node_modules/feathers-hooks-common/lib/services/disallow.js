'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, providers = Array(_len), _key = 0; _key < _len; _key++) {
    providers[_key] = arguments[_key];
  }

  return function (hook) {
    var hookProvider = (hook.params || {}).provider;

    var anyProvider = providers.length === 0;
    var thisProvider = providers.some(function (provider) {
      return provider === hookProvider || provider === 'server' && !hookProvider || provider === 'external' && !!hookProvider;
    });

    if (anyProvider || thisProvider) {
      throw new errors.MethodNotAllowed('Provider \'' + hook.params.provider + '\' can not call \'' + hook.method + '\'. (disableMethod)');
    }
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];