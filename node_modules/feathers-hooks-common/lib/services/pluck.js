'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  return function (context) {
    (0, _checkContextIf2.default)(context, 'before', ['create', 'update', 'patch'], 'pluck');

    if (context.params.provider) {
      (0, _replaceItems2.default)(context, (0, _pluck3.default)((0, _getItems2.default)(context), fieldNames));
    }

    return context;
  };
};

var _pluck2 = require('../common/_pluck');

var _pluck3 = _interopRequireDefault(_pluck2);

var _checkContextIf = require('./check-context-if');

var _checkContextIf2 = _interopRequireDefault(_checkContextIf);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

var _replaceItems = require('./replace-items');

var _replaceItems2 = _interopRequireDefault(_replaceItems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];