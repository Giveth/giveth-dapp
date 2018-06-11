'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (hook, type, methods, label) {
  if (type && hook.type === type) {
    (0, _checkContext2.default)(hook, type, methods, label);
  }
};

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];