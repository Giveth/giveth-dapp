'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fields = Array(_len), _key = 0; _key < _len; _key++) {
    fields[_key] = arguments[_key];
  }

  return function (data) {
    (0, _remove3.default)(data, fields);
    return data;
  };
};

var _remove2 = require('../common/_remove');

var _remove3 = _interopRequireDefault(_remove2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];