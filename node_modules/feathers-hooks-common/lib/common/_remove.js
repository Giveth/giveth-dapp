'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (items /* modified */, fieldNames) {
  (0, _transformItems3.default)(items, fieldNames, function (item, fieldName, value) {
    if (value !== undefined) {
      (0, _deleteByDot2.default)(item, fieldName);
    }
  });
};

var _deleteByDot = require('./delete-by-dot');

var _deleteByDot2 = _interopRequireDefault(_deleteByDot);

var _transformItems2 = require('./_transform-items');

var _transformItems3 = _interopRequireDefault(_transformItems2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];