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

var _controlCommon = require('./controls/control-common');

var _controlCommon2 = _interopRequireDefault(_controlCommon);

var _componentCommon = require('./component-common');

var _componentCommon2 = _interopRequireDefault(_componentCommon);

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

var CheckboxGroup = function (_Component) {
  _inherits(CheckboxGroup, _Component);

  function CheckboxGroup(props) {
    _classCallCheck(this, CheckboxGroup);

    var _this = _possibleConstructorReturn(this, (CheckboxGroup.__proto__ || Object.getPrototypeOf(CheckboxGroup)).call(this, props));

    _this.handleChange = function () {
      var _this$props = _this.props,
          options = _this$props.options,
          name = _this$props.name;

      var checkedOptions = options.filter(function (option) {
        return _this.elements[option.value].checked;
      });
      var value = checkedOptions.map(function (option) {
        return option.value;
      });
      _this.props.onSetValue(value);
      _this.props.onChange(name, value);
    };

    _this.renderElement = function () {
      var controls = _this.props.options.map(function (checkbox) {
        var checked = _this.props.value.indexOf(checkbox.value) !== -1;
        var disabled = checkbox.disabled || _this.props.disabled;
        return _react2.default.createElement(
          'div',
          { className: 'checkbox', key: checkbox.value },
          _react2.default.createElement(
            'label',
            null,
            _react2.default.createElement('input', {
              ref: function ref(input) {
                _this.elements[checkbox.value] = input;
              },
              checked: checked,
              type: 'checkbox',
              value: checkbox.value,
              onChange: _this.handleChange,
              disabled: disabled
            }),
            ' ',
            checkbox.label
          )
        );
      });
      return controls;
    };

    _this.elements = {};
    return _this;
  }

  // Returns an array of the values of all checked items.


  _createClass(CheckboxGroup, [{
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

  return CheckboxGroup;
}(_react.Component);

CheckboxGroup.propTypes = _extends({}, _controlCommon2.default.propTypes, _componentCommon2.default.propTypes, {
  options: _propTypes2.default.arrayOf(_propTypes2.default.shape({
    disabled: _propTypes2.default.bool,
    value: _propTypes2.default.string,
    label: _propTypes2.default.string,
    key: _propTypes2.default.string
  })),
  value: _propTypes2.default.arrayOf(_propTypes2.default.string)
});

CheckboxGroup.defaultProps = _extends({}, _componentCommon2.default.defaultProps, {
  options: [],
  value: []
});

exports.default = CheckboxGroup;