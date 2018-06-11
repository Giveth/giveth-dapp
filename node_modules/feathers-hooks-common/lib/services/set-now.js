'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  if (!fieldNames.length) {
    throw new _feathersErrors2.default.BadRequest('Field name is required. (setNow)');
  }

  return function (hook) {
    (0, _setFields3.default)((0, _getItems2.default)(hook), function () {
      return new Date();
    }, fieldNames, 'setNow');
    return hook;
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _setFields2 = require('../common/_set-fields');

var _setFields3 = _interopRequireDefault(_setFields2);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];