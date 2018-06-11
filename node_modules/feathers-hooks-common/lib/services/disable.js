'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (realm) {
  console.log('DEPRECATED. Use disallow instead. (disable)');

  if (!realm) {
    return function (hook) {
      throw new errors.MethodNotAllowed('Calling \'' + hook.method + '\' not allowed. (disable)');
    };
  }

  if (typeof realm === 'function') {
    return function (hook) {
      var result = realm(hook);
      var update = function update(check) {
        if (!check) {
          throw new errors.MethodNotAllowed('Calling \'' + hook.method + '\' not allowed. (disable)');
        }
      };

      if (result && typeof result.then === 'function') {
        return result.then(update);
      }

      update(result);
    };
  }

  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var providers = [realm].concat(args);

  return function (hook) {
    var provider = hook.params.provider;

    if (realm === 'external' && provider || providers.indexOf(provider) !== -1) {
      throw new errors.MethodNotAllowed('Provider \'' + hook.params.provider + '\' can not call \'' + hook.method + '\'. (disable)\'');
    }
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];