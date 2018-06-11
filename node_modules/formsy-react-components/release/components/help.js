'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Help = function Help(props) {
  return _react2.default.createElement(
    'span',
    { className: 'help-block' },
    props.help
  );
};

Help.propTypes = {
  help: _propTypes2.default.string.isRequired
};

exports.default = Help;