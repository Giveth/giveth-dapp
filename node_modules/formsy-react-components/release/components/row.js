'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _dedupe = require('classnames/dedupe');

var _dedupe2 = _interopRequireDefault(_dedupe);

var _propTypes3 = require('./prop-types');

var _propTypes4 = _interopRequireDefault(_propTypes3);

var _label = require('./label');

var _label2 = _interopRequireDefault(_label);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Row = function Row(props) {
  var elementWrapperClassName = props.elementWrapperClassName,
      required = props.required,
      rowClassName = props.rowClassName,
      showErrors = props.showErrors,
      layout = props.layout,
      label = props.label;


  var element = props.children;

  if (layout === 'elementOnly') {
    return _react2.default.createElement(
      'span',
      null,
      element
    );
  }

  var cssClasses = {
    row: ['form-group'],
    elementWrapper: []
  };

  if (showErrors) {
    cssClasses.row.push('has-error');
    cssClasses.row.push('has-feedback');
  }

  // We should render the label if there is label text defined, or if the
  // component is required (so a required symbol is displayed in the label tag)
  var shouldRenderLabel = label !== null || required;

  if (layout === 'horizontal') {
    // Horizontal layout needs a 'row' class for Bootstrap 4
    cssClasses.row.push('row');

    if (!shouldRenderLabel) {
      cssClasses.elementWrapper.push('col-sm-offset-3');
    }

    cssClasses.elementWrapper.push('col-sm-9');
    cssClasses.elementWrapper.push(elementWrapperClassName);

    element = _react2.default.createElement(
      'div',
      { className: (0, _dedupe2.default)(cssClasses.elementWrapper) },
      element
    );
  }

  cssClasses.row.push(rowClassName);

  return _react2.default.createElement(
    'div',
    { className: (0, _dedupe2.default)(cssClasses.row) },
    shouldRenderLabel ? _react2.default.createElement(_label2.default, props) : null,
    element
  );
};

Row.propTypes = _extends({}, _propTypes4.default, {
  children: _propTypes2.default.node.isRequired,
  fakeLabel: _propTypes2.default.bool,
  htmlFor: _propTypes2.default.string,
  label: _propTypes2.default.node,
  layout: _propTypes2.default.oneOf(['horizontal', 'vertical', 'elementOnly']),
  required: _propTypes2.default.bool,
  showErrors: _propTypes2.default.bool
});

Row.defaultProps = {
  /* eslint-disable react/default-props-match-prop-types */
  elementWrapperClassName: '',
  labelClassName: '',
  rowClassName: '',
  /* eslint-enable */
  fakeLabel: false,
  htmlFor: null,
  label: null,
  layout: 'horizontal',
  required: false,
  showErrors: false
};

exports.default = Row;