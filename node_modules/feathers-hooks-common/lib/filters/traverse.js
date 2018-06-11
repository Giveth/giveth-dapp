'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (converter, getObj) {
  return function (data, connection, hook) {
    var items = typeof getObj === 'function' ? getObj(data, connection, hook) : getObj || data;

    (0, _traverse3.default)(items, converter);
  };
};

var _traverse2 = require('../common/_traverse');

var _traverse3 = _interopRequireDefault(_traverse2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];