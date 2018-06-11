'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  return function (hook) {
    (0, _checkContext2.default)(hook, 'before', null, 'removeQuery');

    var query = (hook.params || {}).query || {};
    (0, _remove3.default)(query, fieldNames);

    return hook;
  };
};

var _remove2 = require('../common/_remove');

var _remove3 = _interopRequireDefault(_remove2);

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];