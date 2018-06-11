"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, permissionHooks = Array(_len), _key = 0; _key < _len; _key++) {
    permissionHooks[_key] = arguments[_key];
  }

  return function (hook) {
    var _this = this;

    var hooks = permissionHooks.map(function (hookFn) {
      return hookFn.call(_this, hook);
    });

    return Promise.all(hooks).then(function (results) {
      return Promise.resolve(results.every(function (result) {
        return !!result;
      }));
    });
  };
};

module.exports = exports["default"];
// 'combine' is like 'every', each permission func must return true