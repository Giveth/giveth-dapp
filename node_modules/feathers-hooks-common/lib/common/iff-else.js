'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (processFuncArray) {
  return function (predicate, trueFuncs, falseFuncs) {
    // fnArgs is [hook] for service & permission hooks, [data, connection, hook] for event filters
    return function () {
      for (var _len = arguments.length, fnArgs = Array(_len), _key = 0; _key < _len; _key++) {
        fnArgs[_key] = arguments[_key];
      }

      if (typeof trueFuncs === 'function') {
        trueFuncs = [trueFuncs];
      }
      if (typeof falseFuncs === 'function') {
        falseFuncs = [falseFuncs];
      }

      // Babel 6.17.0 did not transpile something in the old version similar to this
      // const runProcessFuncArray = funcs => processFuncArray.call(this, fnArgs, funcs);
      var that = this;
      var runProcessFuncArray = function runProcessFuncArray(funcs) {
        return processFuncArray.call(that, fnArgs, funcs);
      };

      // const check = typeof predicate === 'function' ? predicate(...fnArgs) : !!predicate;
      var check = typeof predicate === 'function' ? predicate.apply(that, fnArgs) : !!predicate;

      if (!check) {
        return runProcessFuncArray(falseFuncs);
      }

      if (typeof check.then !== 'function') {
        return runProcessFuncArray(trueFuncs);
      }

      return check.then(function (check1) {
        return runProcessFuncArray(check1 ? trueFuncs : falseFuncs);
      });
    };
  };
};

module.exports = exports['default'];
// processFuncArray must handle case of null param.