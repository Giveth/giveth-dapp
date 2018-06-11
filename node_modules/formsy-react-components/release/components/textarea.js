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

var _row = require('./row');

var _row2 = _interopRequireDefault(_row);

var _textarea = require('./controls/textarea');

var _textarea2 = _interopRequireDefault(_textarea);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Textarea = function (_Component) {
  _inherits(Textarea, _Component);

  function Textarea(props) {
    _classCallCheck(this, Textarea);

    var _this = _possibleConstructorReturn(this, (Textarea.__proto__ || Object.getPrototypeOf(Textarea)).call(this, props));

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
        _this.blurDebounced(value);
      }
      _this.props.onBlur(_this.props.name, value);
    };

    _this.initElementRef = function (control) {
      _this.element = control ? control.element : null;
    };

    _this.state = { value: props.value };
    _this.changeDebounced = (0, _lodash2.default)(props.onSetValue, props.changeDebounceInterval);
    _this.blurDebounced = (0, _lodash2.default)(props.onSetValue, props.blurDebounceInterval);
    return _this;
  }

  _createClass(Textarea, [{
    key: 'render',
    value: function render() {
      var inputProps = Object.assign({}, this.props);
      Object.keys(_componentCommon2.default.propTypes).forEach(function (key) {
        delete inputProps[key];
      });
      delete inputProps.blurDebounceInterval;
      delete inputProps.changeDebounceInterval;
      delete inputProps.updateOnBlur;
      delete inputProps.updateOnChange;

      var element = _react2.default.createElement(_textarea2.default, _extends({}, inputProps, {
        value: this.state.value,
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        ref: this.initElementRef
      }));

      if (this.props.layout === 'elementOnly') {
        return element;
      }

      return _react2.default.createElement(
        _row2.default,
        _extends({}, this.props, { htmlFor: this.props.id }),
        element,
        this.props.help ? _react2.default.createElement(_help2.default, { help: this.props.help }) : null,
        this.props.showErrors ? _react2.default.createElement(_errorMessages2.default, { messages: this.props.errorMessages }) : null
      );
    }
  }]);

  return Textarea;
}(_react.Component);

Textarea.propTypes = _extends({}, _componentCommon2.default.propTypes, _textarea2.default.propTypes, {
  blurDebounceInterval: _propTypes2.default.number,
  changeDebounceInterval: _propTypes2.default.number,
  updateOnBlur: _propTypes2.default.bool,
  updateOnChange: _propTypes2.default.bool,
  value: _propTypes2.default.string,
  onBlur: _propTypes2.default.func
});

Textarea.defaultProps = _extends({}, _componentCommon2.default.defaultProps, {
  updateOnBlur: true,
  updateOnChange: true,
  blurDebounceInterval: 0,
  changeDebounceInterval: 500,
  onBlur: function onBlur() {}
});

exports.default = Textarea;