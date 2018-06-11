'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  return function (context) {
    (0, _checkContext2.default)(context, 'before', null, 'pluckQuery');

    var query = (context.params || {}).query || {};
    context.params.query = (0, _pluck3.default)(query, fieldNames);

    return context;
  };
};

var _pluck2 = require('../common/_pluck');

var _pluck3 = _interopRequireDefault(_pluck2);

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];