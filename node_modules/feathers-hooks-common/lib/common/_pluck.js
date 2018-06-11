'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (items, fieldNames) {
  if (!Array.isArray(items)) {
    return _pluckItem(items, fieldNames);
  }

  var pluckedItems = [];

  (Array.isArray(items) ? items : [items]).forEach(function (item) {
    pluckedItems.push(_pluckItem(item, fieldNames));
  });

  return pluckedItems;
};

var _getByDot = require('./get-by-dot');

var _getByDot2 = _interopRequireDefault(_getByDot);

var _setByDot = require('./set-by-dot');

var _setByDot2 = _interopRequireDefault(_setByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _pluckItem(item, fieldNames) {
  var plucked = {};

  fieldNames.forEach(function (fieldName) {
    var value = (0, _getByDot2.default)(item, fieldName);
    if (value !== undefined) {
      // prevent setByDot creating nested empty objects
      (0, _setByDot2.default)(plucked, fieldName, value);
    }
  });

  return plucked;
}
module.exports = exports['default'];