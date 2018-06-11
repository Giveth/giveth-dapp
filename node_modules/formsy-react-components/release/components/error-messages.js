'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ErrorMessages = function ErrorMessages(props) {
  var messageNodes = props.messages.map(function (message, key) {
    return (
      // eslint-disable-next-line react/no-array-index-key
      _react2.default.createElement(
        'span',
        { key: key, className: 'help-block validation-message' },
        message
      )
    );
  });
  return _react2.default.createElement(
    'div',
    null,
    messageNodes
  );
};

ErrorMessages.propTypes = {
  messages: _propTypes2.default.arrayOf(_propTypes2.default.node)
};

ErrorMessages.defaultProps = {
  messages: []
};

exports.default = ErrorMessages;