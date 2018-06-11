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

var _controlCommon = require('./control-common');

var _controlCommon2 = _interopRequireDefault(_controlCommon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var InputControl = function (_Component) {
  _inherits(InputControl, _Component);

  function InputControl() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, InputControl);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = InputControl.__proto__ || Object.getPrototypeOf(InputControl)).call.apply(_ref, [this].concat(args))), _this), _this.initElementRef = function (element) {
      _this.element = element;
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(InputControl, [{
    key: 'render',
    value: function render() {
      var className = this.props.className;

      if (['hidden', 'range'].indexOf(this.props.type) !== -1) {
        className = null;
      }
      return _react2.default.createElement('input', _extends({}, this.props, { className: className, ref: this.initElementRef }));
    }
  }]);

  return InputControl;
}(_react.Component);

InputControl.propTypes = _extends({}, _controlCommon2.default.propTypes, {
  value: _propTypes2.default.string.isRequired,
  type: _propTypes2.default.string,
  className: _propTypes2.default.string
});

InputControl.defaultProps = {
  className: 'form-control',
  type: 'text'
};

exports.default = InputControl;