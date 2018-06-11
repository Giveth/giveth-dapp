'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (items /* modified */, fieldNames, transformer) {
  (Array.isArray(items) ? items : [items]).forEach(function (item) {
    fieldNames.forEach(function (fieldName) {
      transformer(item, fieldName, (0, _getByDot2.default)(item, fieldName));
    });
  });
};

var _getByDot = require('./get-by-dot');

var _getByDot2 = _interopRequireDefault(_getByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];

// transformer(item /* modified */, fieldName, value)