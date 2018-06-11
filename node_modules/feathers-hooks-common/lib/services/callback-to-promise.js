"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (func, paramsCountExcludingCb) {
  var _this = this;

  paramsCountExcludingCb = Math.max(paramsCountExcludingCb, 0);

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var self = _this;

    // Get the correct number of args
    var argsLen = args.length;
    if (argsLen < paramsCountExcludingCb) {
      // Array.apply(null, Array(5)) creates a dense array of 5 undefined
      var extraArgs = Array.apply(null, Array(paramsCountExcludingCb - argsLen));
      args = Array.prototype.concat.call(args, extraArgs);
    }
    if (args.length > paramsCountExcludingCb) {
      args = Array.prototype.slice.call(args, 0, paramsCountExcludingCb);
    }

    return new Promise(function (resolve, reject) {
      // eslint-disable-line consistent-return
      args.push(function (err, data) {
        return err ? reject(err) : resolve(data);
      });
      func.apply(self, args);
    });
  };
};

module.exports = exports["default"];