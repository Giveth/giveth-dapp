'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (slug, field) {
  return function (hook) {
    if (typeof field !== 'string') {
      field = 'query.' + slug;
    }

    if (hook.type === 'after') {
      throw new errors.GeneralError('Cannot set slug on after hook. (setSlug)');
    }

    if (hook.params && hook.params.provider === 'rest') {
      var value = hook.params[slug];
      if (typeof value === 'string' && value[0] !== ':') {
        (0, _setByDot2.default)(hook.params, field, value);
      }
    }
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _setByDot = require('../common/set-by-dot');

var _setByDot2 = _interopRequireDefault(_setByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];