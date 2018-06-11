'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Wraps an input to implement a Bootstrap [Input Group](http://getbootstrap.com/components/#input-groups)
 */
var InputGroup = function InputGroup(props) {
  var renderAddon = function renderAddon(addon) {
    if (!addon) {
      return null;
    }
    return _react2.default.createElement(
      'span',
      { className: 'input-group-addon' },
      addon
    );
  };

  var renderButton = function renderButton(button) {
    if (!button) {
      return null;
    }
    return _react2.default.createElement(
      'span',
      { className: 'input-group-btn' },
      button
    );
  };

  return _react2.default.createElement(
    'div',
    { className: 'input-group' },
    renderAddon(props.addonBefore),
    renderButton(props.buttonBefore),
    props.children,
    renderAddon(props.addonAfter),
    renderButton(props.buttonAfter)
  );
};

InputGroup.propTypes = {
  children: _propTypes2.default.node.isRequired,
  addonAfter: _propTypes2.default.node,
  addonBefore: _propTypes2.default.node,
  buttonAfter: _propTypes2.default.node,
  buttonBefore: _propTypes2.default.node
};

InputGroup.defaultProps = {
  addonAfter: null,
  addonBefore: null,
  buttonAfter: null,
  buttonBefore: null
};

exports.default = InputGroup;