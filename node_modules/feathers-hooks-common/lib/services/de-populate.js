'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  return function (hook) {
    var items = (0, _getItems2.default)(hook);

    (Array.isArray(items) ? items : [items]).forEach(function (item) {
      removeProps('_computed', item);
      removeProps('_include', item);
      delete item._elapsed;
    });

    (0, _replaceItems2.default)(hook, items);
    return hook;
  };
};

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

var _replaceItems = require('./replace-items');

var _replaceItems2 = _interopRequireDefault(_replaceItems);

var _deleteByDot = require('../common/delete-by-dot');

var _deleteByDot2 = _interopRequireDefault(_deleteByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function removeProps(name, item) {
  if (name in item) {
    item[name].forEach(function (key) {
      (0, _deleteByDot2.default)(item, key);
    });
    delete item[name];
  }
}
module.exports = exports['default'];