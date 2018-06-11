'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _controlCommon = require('./control-common');

var _controlCommon2 = _interopRequireDefault(_controlCommon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// A file control can only be set to an empty string.
// I think we need to keep this as an uncontrolled component, so we override the
// value.prop.
var FileControl = function (_Component) {
  _inherits(FileControl, _Component);

  function FileControl() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, FileControl);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = FileControl.__proto__ || Object.getPrototypeOf(FileControl)).call.apply(_ref, [this].concat(args))), _this), _this.initElementRef = function (element) {
      _this.element = element;
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(FileControl, [{
    key: 'render',
    value: function render() {
      var props = _extends({}, this.props);
      delete props.label;
      delete props.value;
      return _react2.default.createElement('input', _extends({}, props, { type: 'file', ref: this.initElementRef }));
    }
  }]);

  return FileControl;
}(_react.Component);

FileControl.propTypes = _extends({}, _controlCommon2.default.propTypes);

exports.default = FileControl;