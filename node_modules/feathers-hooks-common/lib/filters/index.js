'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _combine = require('./combine');

var _combine2 = _interopRequireDefault(_combine);

var _conditionals2 = require('../common/_conditionals');

var _conditionals3 = _interopRequireDefault(_conditionals2);

var _pluck = require('./pluck');

var _pluck2 = _interopRequireDefault(_pluck);

var _remove = require('./remove');

var _remove2 = _interopRequireDefault(_remove);

var _setFilteredAt = require('./set-filtered-at');

var _setFilteredAt2 = _interopRequireDefault(_setFilteredAt);

var _traverse = require('./traverse');

var _traverse2 = _interopRequireDefault(_traverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var conditionals = (0, _conditionals3.default)(function (filterFnArgs, eventFilters) {
  return eventFilters ? _combine2.default.apply(undefined, _toConsumableArray(eventFilters)).call(this, filterFnArgs) : filterFnArgs[0];
});

exports.default = Object.assign({ combine: _combine2.default,
  pluck: _pluck2.default,
  remove: _remove2.default,
  setFilteredAt: _setFilteredAt2.default,
  traverse: _traverse2.default
}, conditionals);
module.exports = exports['default'];