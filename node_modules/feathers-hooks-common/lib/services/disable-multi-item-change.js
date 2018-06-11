'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  return function (context) {
    (0, _checkContext2.default)(context, 'before', ['update', 'patch', 'remove'], 'disableMultiItemChange');

    if (context.id === null) {
      throw new _feathersErrors2.default.BadRequest('Multi-record changes not allowed for ' + context.path + ' ' + context.method + '. (disableMultiItemChange)');
    }
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];