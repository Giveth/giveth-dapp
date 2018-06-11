'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function () {
  for (var _len = arguments.length, whitelist = Array(_len), _key = 0; _key < _len; _key++) {
    whitelist[_key] = arguments[_key];
  }

  return function (hook) {
    var params = hook.params;

    if (params && params.query && params.query.$client && _typeof(params.query.$client) === 'object') {
      var client = params.query.$client;

      whitelist.forEach(function (key) {
        if (key in client) {
          params[key] = client[key];
        }
      });

      params.query = Object.assign({}, params.query);
      delete params.query.$client;
    }

    return hook;
  };
};

module.exports = exports['default'];