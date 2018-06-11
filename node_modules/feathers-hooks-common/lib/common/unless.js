'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_iffElse) {
  return function (unlessFcn) {
    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    if (typeof unlessFcn === 'function') {
      return _iffElse(unlessFcn, null, rest);
    }

    return _iffElse(unlessFcn, null, rest);
  };
};

module.exports = exports['default'];