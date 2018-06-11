'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (items /* modified */, fieldValue, fieldNames, defaultFieldName) {
  var value = typeof fieldValue === 'function' ? fieldValue() : fieldValue;

  if (!fieldNames.length) fieldNames = [defaultFieldName];

  (Array.isArray(items) ? items : [items]).forEach(function (item) {
    fieldNames.forEach(function (fieldName) {
      (0, _setByDot2.default)(item, fieldName, value);
    });
  });
};

var _setByDot = require('./set-by-dot');

var _setByDot2 = _interopRequireDefault(_setByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];