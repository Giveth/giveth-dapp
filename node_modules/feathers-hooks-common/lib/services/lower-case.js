'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  return function (hook) {
    (0, _checkContextIf2.default)(hook, 'before', ['create', 'update', 'patch'], 'lowercase');

    (0, _transformItems3.default)((0, _getItems2.default)(hook), fieldNames, function (item, fieldName, value) {
      if (value !== undefined) {
        if (typeof value !== 'string' && value !== null) {
          throw new errors.BadRequest('Expected string data. (lowercase ' + fieldName + ')');
        }

        (0, _setByDot2.default)(item, fieldName, value ? value.toLowerCase() : value);
      }
    });

    return hook;
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _transformItems2 = require('../common/_transform-items');

var _transformItems3 = _interopRequireDefault(_transformItems2);

var _checkContextIf = require('./check-context-if');

var _checkContextIf2 = _interopRequireDefault(_checkContextIf);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

var _setByDot = require('../common/set-by-dot');

var _setByDot2 = _interopRequireDefault(_setByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];