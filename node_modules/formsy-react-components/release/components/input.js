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

var _lodash = require('lodash.debounce');

var _lodash2 = _interopRequireDefault(_lodash);

var _componentCommon = require('./component-common');

var _componentCommon2 = _interopRequireDefault(_componentCommon);

var _errorMessages = require('./error-messages');

var _errorMessages2 = _interopRequireDefault(_errorMessages);

var _help = require('./help');

var _help2 = _interopRequireDefault(_help);

var _icon = require('./icon');

var _icon2 = _interopRequireDefault(_icon);

var _input = require('./controls/input');

var _input2 = _interopRequireDefault(_input);

var _inputGroup = require('./input-group');

var _inputGroup2 = _interopRequireDefault(_inputGroup);

var _row = require('./row');

var _row2 = _interopRequireDefault(_row);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Input = function (_Component) {
  _inherits(Input, _Component);

  function Input(props) {
    _classCallCheck(this, Input);

    var _this = _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).call(this, props));

    _this.componentWillReceiveProps = function (nextProps) {
      var isValueChanging = nextProps.value !== _this.state.value;
      if (isValueChanging) {
        _this.setState({ value: nextProps.value });
        _this.props.onSetValue(nextProps.value);
      }
    };

    _this.handleChange = function (event) {
      var value = event.currentTarget.value;

      _this.setState({ value: value });
      if (_this.props.updateOnChange) {
        _this.changeDebounced(value);
      }
      _this.props.onChange(_this.props.name, value);
    };

    _this.handleBlur = function (event) {
      var value = event.currentTarget.value;

      _this.setState({ value: value });
      if (_this.props.updateOnBlur) {
        _this.changeDebounced.cancel();
        if (_this.props.isPristine()) {
          // should update as we have just left a pristine input
          _this.blurDebounced(value);
        } else if (_this.props.value !== value) {
          // should update because the value has changed
          _this.blurDebounced(value);
        }
      }
      _this.props.onBlur(_this.props.name, value);
    };

    _this.handleKeyDown = function (event) {
      if (event.key === 'Enter') {
        _this.changeDebounced.flush();
      }
      _this.props.onKeyDown(event);
    };

    _this.initElementRef = function (control) {
      _this.element = control ? control.element : null;
    };

    _this.state = { value: props.value };
    _this.changeDebounced = (0, _lodash2.default)(props.onSetValue, props.changeDebounceInterval);
    _this.blurDebounced = (0, _lodash2.default)(props.onSetValue, props.blurDebounceInterval);
    return _this;
  }

  _createClass(Input, [{
    key: 'render',
    value: function render() {
      var inputProps = Object.assign({}, this.props);
      Object.keys(_componentCommon2.default.propTypes).forEach(function (key) {
        delete inputProps[key];
      });
      delete inputProps.addonAfter;
      delete inputProps.addonBefore;
      delete inputProps.buttonAfter;
      delete inputProps.buttonBefore;
      delete inputProps.blurDebounceInterval;
      delete inputProps.changeDebounceInterval;
      delete inputProps.updateOnBlur;
      delete inputProps.updateOnChange;
      delete inputProps.value;
      delete inputProps.onBlur;

      var control = _react2.default.createElement(_input2.default, _extends({}, inputProps, {
        value: this.state.value,
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        onKeyDown: this.handleKeyDown,
        ref: this.initElementRef
      }));

      if (this.props.type === 'hidden') {
        return control;
      }

      if (this.props.addonBefore || this.props.addonAfter || this.props.buttonBefore || this.props.buttonAfter) {
        control = _react2.default.createElement(
          _inputGroup2.default,
          this.props,
          control
        );
      }

      if (this.props.layout === 'elementOnly') {
        return control;
      }

      return _react2.default.createElement(
        _row2.default,
        _extends({}, this.props, { htmlFor: this.props.id }),
        control,
        this.props.showErrors ? _react2.default.createElement(_icon2.default, { symbol: 'remove', className: 'form-control-feedback' }) : null,
        this.props.help ? _react2.default.createElement(_help2.default, { help: this.props.help }) : null,
        this.props.showErrors ? _react2.default.createElement(_errorMessages2.default, { messages: this.props.errorMessages }) : null
      );
    }
  }]);

  return Input;
}(_react.Component);

var _InputControl$propTyp = _toArray(_input2.default.propTypes),
    inputGroupPropTypes = _InputControl$propTyp.slice(0);

delete inputGroupPropTypes.children;

Input.propTypes = _extends({}, _input2.default.propTypes, inputGroupPropTypes, _componentCommon2.default.propTypes, {
  blurDebounceInterval: _propTypes2.default.number,
  changeDebounceInterval: _propTypes2.default.number,
  type: _propTypes2.default.oneOf(['color', 'date', 'datetime', 'datetime-local', 'email', 'hidden', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week']),
  updateOnBlur: _propTypes2.default.bool,
  updateOnChange: _propTypes2.default.bool,
  value: _propTypes2.default.string,
  onBlur: _propTypes2.default.func,
  onKeyDown: _propTypes2.default.func
});

Input.defaultProps = _extends({}, _componentCommon2.default.defaultProps, _inputGroup2.default.defaultProps, {
  type: 'text',
  value: '',
  updateOnBlur: true,
  updateOnChange: true,
  blurDebounceInterval: 0,
  changeDebounceInterval: 500,
  onBlur: function onBlur() {},
  onKeyDown: function onKeyDown() {}
});

exports.default = Input;