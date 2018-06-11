"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
    rest[_key] = arguments[_key];
  }

  return function () {
    var _this = this;

    for (var _len2 = arguments.length, fnArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      fnArgs[_key2] = arguments[_key2];
    }

    var promises = rest.map(function (fn) {
      return fn.apply(_this, fnArgs);
    });

    return Promise.all(promises).then(function (results) {
      return Promise.resolve(results.every(function (result) {
        return !!result;
      }));
    });
  };
};

module.exports = exports["default"];