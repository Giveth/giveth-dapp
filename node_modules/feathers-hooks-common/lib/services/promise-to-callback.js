'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (promise) {
  return function (cb) {
    promise.then(function (data) {
      asap(cb, null, data);
      return data;
    }, function (err) {
      asap(cb, err);
    });

    return null;
  };
};

/* globals setImmediate:1 */

var asap = process && typeof process.nextTick === 'function' ? process.nextTick : setImmediate;

module.exports = exports['default'];