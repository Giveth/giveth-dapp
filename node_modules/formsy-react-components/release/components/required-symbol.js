'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RequiredSymbol = function RequiredSymbol(props) {
  if (props.required === false) {
    return null;
  }
  return _react2.default.createElement(
    'span',
    { className: 'required-symbol' },
    props.symbol
  );
};

RequiredSymbol.propTypes = {
  required: _propTypes2.default.bool.isRequired,
  symbol: _propTypes2.default.node
};

RequiredSymbol.defaultProps = {
  symbol: ' *'
};

exports.default = RequiredSymbol;