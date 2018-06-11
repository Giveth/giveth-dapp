'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, fieldNames = Array(_len), _key = 0; _key < _len; _key++) {
    fieldNames[_key] = arguments[_key];
  }

  console.log('DEPRECATED. Use discard. (remove)');

  return function (hook) {
    (0, _checkContextIf2.default)(hook, 'before', ['create', 'update', 'patch'], 'remove');

    if (hook.params.provider) {
      (0, _remove3.default)((0, _getItems2.default)(hook), fieldNames);
    }

    return hook;
  };
};

var _remove2 = require('../common/_remove');

var _remove3 = _interopRequireDefault(_remove2);

var _checkContextIf = require('./check-context-if');

var _checkContextIf2 = _interopRequireDefault(_checkContextIf);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];