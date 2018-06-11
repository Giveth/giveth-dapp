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

var Checkbox = function (_Component) {
  _inherits(Checkbox, _Component);

  function Checkbox() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, Checkbox);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Checkbox.__proto__ || Object.getPrototypeOf(Checkbox)).call.apply(_ref, [this].concat(args))), _this), _this.handleChange = function (event) {
      var value = event.currentTarget.checked;
      _this.props.onSetValue(value);
      _this.props.onChange(_this.props.name, value);
    }, _this.initElementRef = function (element) {
      _this.element = element;
    }, _this.renderElement = function () {
      var inputProps = Object.assign({}, _this.props);
      Object.keys(_componentCommon2.default.propTypes).forEach(function (key) {
        delete inputProps[key];
      });
      delete inputProps.valueLabel;
      delete inputProps.label;
      return _react2.default.createElement(
        'div',
        { className: 'checkbox' },
        _react2.default.createElement(
          'label',
          null,
          _react2.default.createElement('input', _extends({}, inputProps, {
            type: 'checkbox',
            checked: _this.props.value === true,
            onChange: _this.handleChange,
            ref: _this.initElementRef
          })),
          ' ',
          _this.props.valueLabel
        )
      );
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(Checkbox, [{
    key: 'render',
    value: function render() {
      var element = this.renderElement();

      if (this.props.layout === 'elementOnly') {
        return element;
      }

      return _react2.default.createElement(
        _row2.default,
        _extends({}, this.props, { fakeLabel: true, htmlFor: this.props.id }),
        element,
        this.props.help ? _react2.default.createElement(_help2.default, { help: this.props.help }) : null,
        this.props.showErrors ? _react2.default.createElement(_errorMessages2.default, { messages: this.props.errorMessages }) : null
      );
    }
  }]);

  return Checkbox;
}(_react.Component);

Checkbox.propTypes = _extends({}, _controlCommon2.default.propTypes, _componentCommon2.default.propTypes, {
  value: _propTypes2.default.bool,
  valueLabel: _propTypes2.default.string
});

Checkbox.defaultProps = _extends({}, _componentCommon2.default.defaultProps, {
  value: false,
  valueLabel: ''
});

exports.default = Checkbox;