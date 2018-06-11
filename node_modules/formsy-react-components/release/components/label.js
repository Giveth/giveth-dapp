'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _dedupe = require('classnames/dedupe');

var _dedupe2 = _interopRequireDefault(_dedupe);

var _requiredSymbol = require('./required-symbol');

var _requiredSymbol2 = _interopRequireDefault(_requiredSymbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Label = function Label(props) {
  var layout = props.layout,
      label = props.label,
      htmlFor = props.htmlFor,
      labelClassName = props.labelClassName,
      fakeLabel = props.fakeLabel,
      required = props.required;


  if (layout === 'elementOnly') {
    return null;
  }

  var labelClassNames = (0, _dedupe2.default)(['control-label', layout === 'horizontal' ? 'col-sm-3' : '', labelClassName]);

  if (fakeLabel) {
    return _react2.default.createElement(
      'div',
      { className: labelClassNames, 'data-required': required },
      _react2.default.createElement(
        'strong',
        null,
        label,
        _react2.default.createElement(_requiredSymbol2.default, { required: required })
      )
    );
  }

  return _react2.default.createElement(
    'label',
    {
      className: labelClassNames,
      'data-required': required,
      htmlFor: htmlFor },
    label,
    _react2.default.createElement(_requiredSymbol2.default, { required: required })
  );
};

Label.propTypes = {
  fakeLabel: _propTypes2.default.bool,
  htmlFor: _propTypes2.default.string,
  label: _propTypes2.default.node,
  labelClassName: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.array, _propTypes2.default.object]),
  layout: _propTypes2.default.oneOf(['horizontal', 'vertical', 'elementOnly']),
  required: _propTypes2.default.bool
};

Label.defaultProps = {
  fakeLabel: false,
  htmlFor: null,
  label: null,
  labelClassName: '',
  layout: 'horizontal',
  required: false
};

exports.default = Label;