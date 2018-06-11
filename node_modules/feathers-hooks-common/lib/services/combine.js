'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, serviceHooks = Array(_len), _key = 0; _key < _len; _key++) {
    serviceHooks[_key] = arguments[_key];
  }

  return function (hook) {
    return _commons.processHooks.call(this, serviceHooks, hook);
  };
};

var _commons = require('feathers-hooks/lib/commons');

module.exports = exports['default'];