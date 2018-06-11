'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _combine = require('./combine');

var _combine2 = _interopRequireDefault(_combine);

var _conditionals2 = require('../common/_conditionals');

var _conditionals3 = _interopRequireDefault(_conditionals2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var conditionals = (0, _conditionals3.default)(function (hookFnArgs, permissionsHooks) {
  return permissionsHooks ? _combine2.default.apply(undefined, _toConsumableArray(permissionsHooks)).call(this, hookFnArgs[0]) : hookFnArgs[0];
});

exports.default = Object.assign({ combine: _combine2.default }, conditionals);
module.exports = exports['default'];