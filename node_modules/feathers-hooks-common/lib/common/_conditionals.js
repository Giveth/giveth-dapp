'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = conditionals;

var _iffElse2 = require('./iff-else');

var _iffElse3 = _interopRequireDefault(_iffElse2);

var _iff = require('./iff');

var _iff2 = _interopRequireDefault(_iff);

var _unless = require('./unless');

var _unless2 = _interopRequireDefault(_unless);

var _some = require('./some');

var _some2 = _interopRequireDefault(_some);

var _every = require('./every');

var _every2 = _interopRequireDefault(_every);

var _isNot = require('./is-not');

var _isNot2 = _interopRequireDefault(_isNot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// processFuncArray must handle case of null param.
function conditionals(processFuncArray) {
  var _iffElse = (0, _iffElse3.default)(processFuncArray);

  return {
    iffElse: _iffElse,
    iff: (0, _iff2.default)(_iffElse),
    when: (0, _iff2.default)(_iffElse),
    unless: (0, _unless2.default)(_iffElse),
    some: _some2.default,
    every: _every2.default,
    isNot: _isNot2.default
  };
}
module.exports = exports['default'];