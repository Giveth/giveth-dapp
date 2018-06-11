'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (converter, getObj) {
  return function (hook) {
    var items = typeof getObj === 'function' ? getObj(hook) : getObj || (0, _getItems2.default)(hook);

    (0, _traverse3.default)(items, converter);
    return hook;
  };
};

var _traverse2 = require('../common/_traverse');

var _traverse3 = _interopRequireDefault(_traverse2);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];