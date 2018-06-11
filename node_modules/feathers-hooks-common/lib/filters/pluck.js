'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fields = Array(_len), _key = 0; _key < _len; _key++) {
    fields[_key] = arguments[_key];
  }

  return function (data) {
    return (0, _pluck3.default)(data, fields);
  };
};

var _pluck2 = require('../common/_pluck');

var _pluck3 = _interopRequireDefault(_pluck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];