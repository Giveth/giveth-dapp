'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _componentCommon = require('./component-common');

var _componentCommon2 = _interopRequireDefault(_componentCommon);

var _controlCommon = require('./controls/control-common');

var _controlCommon2 = _interopRequireDefault(_controlCommon);

var _errorMessages = require('./error-messages');

var _errorMessages2 = _interopRequireDefault(_errorMessages);

var _help = require('./help');

var _help2 = _interopRequireDefault(_help);

var _row = require('./row');

var _row2 = _interopRequireDefault(_row);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RadioGroup = function (_Component) {
  _inherits(RadioGroup, _Component);

  function RadioGroup(props) {
    _classCallCheck(this, RadioGroup);

    var _this = _possibleConstructorReturn(this, (RadioGroup.__proto__ || Object.getPrototypeOf(RadioGroup)).call(this, props));

    _this.handleChange = function (event) {
      var value = event.currentTarget.value;

      _this.props.onSetValue(value);
      _this.props.onChange(_this.props.name, value);
    };

    _this.renderElement = function () {
      var controls = _this.props.options.map(function (radio) {
        var checked = _this.props.value === radio.value;
        var disabled = radio.disabled || _this.props.disabled;
        var className = 'radio' + (disabled ? ' disabled' : '');
        if (_this.props.type === 'inline') {
          return _react2.default.createElement(
            'label',
            { className: 'radio-inline', key: radio.value },
            _react2.default.createElement('input', {
              ref: function ref(input) {
                _this.elements[radio.value] = input;
              },
              checked: checked,
              type: 'radio',
              value: radio.value,
              onChange: _this.handleChange,
              disabled: disabled
            }),
            ' ',
            radio.label
          );
        }
        return _react2.default.createElement(
          'div',
          { className: className, key: radio.value },
          _react2.default.createElement(
            'label',
            null,
            _react2.default.createElement('input', {
              ref: function ref(input) {
                _this.elements[radio.value] = input;
              },
              checked: checked,
              type: 'radio',
              value: radio.value,
              onChange: _this.handleChange,
              disabled: disabled
            }),
            ' ',
            radio.label
          )
        );
      });
      return controls;
    };

    _this.elements = {};
    return _this;
  }

  _createClass(RadioGroup, [{
    key: 'render',
    value: function render() {
      var element = this.renderElement();

      if (this.props.layout === 'elementOnly') {
        return _react2.default.createElement(
          'div',
          null,
          element
        );
      }

      return _react2.default.createElement(
        _row2.default,
        _extends({}, this.props, { fakeLabel: true }),
        element,
        this.props.help ? _react2.default.createElement(_help2.default, { help: this.props.help }) : null,
        this.props.showErrors ? _react2.default.createElement(_errorMessages2.default, { messages: this.props.errorMessages }) : null
      );
    }
  }]);

  return RadioGroup;
}(_react.Component);

RadioGroup.propTypes = _extends({}, _controlCommon2.default.propTypes, _componentCommon2.default.propTypes, {
  options: _propTypes2.default.arrayOf(_propTypes2.default.shape({
    disabled: _propTypes2.default.bool,
    value: _propTypes2.default.string,
    label: _propTypes2.default.node
  })),
  type: _propTypes2.default.oneOf(['inline', 'stacked'])
});

RadioGroup.defaultProps = _extends({}, _componentCommon2.default.defaultProps, {
  type: 'stacked',
  options: []
});

exports.default = RadioGroup;