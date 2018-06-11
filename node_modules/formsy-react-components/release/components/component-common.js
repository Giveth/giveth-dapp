'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _propTypes3 = require('./prop-types');

var _propTypes4 = _interopRequireDefault(_propTypes3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ComponentCommon = function ComponentCommon() {
  return _react2.default.createElement(
    'h1',
    null,
    'This component just holds props and default props.'
  );
};

ComponentCommon.propTypes = _extends({}, _propTypes4.default, {
  onChange: _propTypes2.default.func,
  onSetValue: _propTypes2.default.func,
  isPristine: _propTypes2.default.func.isRequired,
  errorMessages: _propTypes2.default.arrayOf(_propTypes2.default.node),
  help: _propTypes2.default.string,
  label: _propTypes2.default.node,
  layout: _propTypes2.default.oneOf(['horizontal', 'vertical', 'elementOnly']),
  showErrors: _propTypes2.default.bool
});

ComponentCommon.defaultProps = {
  onChange: function onChange() {},
  onSetValue: function onSetValue() {},
  errorMessages: [],
  help: null,
  label: null,
  layout: 'horizontal',
  showErrors: true
};

exports.default = ComponentCommon;