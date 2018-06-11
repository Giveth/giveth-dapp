'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ControlCommon = function ControlCommon(props) {
  return _react2.default.createElement(
    'h1',
    props,
    'This component just holds props and default props.'
  );
};

ControlCommon.propTypes = {
  id: _propTypes2.default.string.isRequired,
  name: _propTypes2.default.string.isRequired,
  disabled: _propTypes2.default.bool
};

ControlCommon.defaultProps = {
  disabled: false
};

exports.default = ControlCommon;