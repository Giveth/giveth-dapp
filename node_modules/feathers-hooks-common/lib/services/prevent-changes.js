'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  return function (hook) {
    (0, _checkContext2.default)(hook, 'before', ['patch'], 'preventChanges');
    var data = hook.data;

    fieldNames.forEach(function (name) {
      if ((0, _existsByDot2.default)(data, name)) {
        throw new _feathersErrors2.default.BadRequest(name + ' may not be patched. (preventChanges)');
      }
    });
  };
};

var _existsByDot = require('../common/exists-by-dot');

var _existsByDot2 = _interopRequireDefault(_existsByDot);

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];