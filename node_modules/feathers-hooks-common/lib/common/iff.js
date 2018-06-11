"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_iffElse) {
  return function (predicate) {
    for (var _len = arguments.length, trueHooks = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      trueHooks[_key - 1] = arguments[_key];
    }

    var that = this;

    function iffWithoutElse(hook) {
      var _ref;

      return _iffElse(predicate, (_ref = []).concat.apply(_ref, trueHooks), null).call(that, hook);
    }
    iffWithoutElse.else = function () {
      var _ref2, _ref3;

      return _iffElse(predicate, (_ref2 = []).concat.apply(_ref2, trueHooks), (_ref3 = []).concat.apply(_ref3, arguments));
    };

    return iffWithoutElse;
  };
};

module.exports = exports["default"];