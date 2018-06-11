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

var _dedupe = require('classnames/dedupe');

var _dedupe2 = _interopRequireDefault(_dedupe);

var _formsyReact = require('formsy-react');

var _formsyReact2 = _interopRequireDefault(_formsyReact);

var _optionsProvider = require('./hoc/options-provider');

var _optionsProvider2 = _interopRequireDefault(_optionsProvider);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Form = function (_Component) {
  _inherits(Form, _Component);

  function Form() {
    _classCallCheck(this, Form);

    return _possibleConstructorReturn(this, (Form.__proto__ || Object.getPrototypeOf(Form)).apply(this, arguments));
  }

  _createClass(Form, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var formsyProps = Object.assign({}, this.props);
      delete formsyProps.elementWrapperClassName;
      delete formsyProps.labelClassName;
      delete formsyProps.layout;
      delete formsyProps.rowClassName;
      delete formsyProps.validatePristine;
      delete formsyProps.validateOnSubmit;

      var refCallback = function refCallback(formsyForm) {
        _this2.formsyForm = formsyForm;
      };

      var formClassNames = (0, _dedupe2.default)(['form-' + this.props.layout, this.props.className]);

      return _react2.default.createElement(
        _optionsProvider2.default,
        this.props,
        _react2.default.createElement(
          _formsyReact2.default,
          _extends({}, formsyProps, { className: formClassNames, ref: refCallback }),
          this.props.children
        )
      );
    }
  }]);

  return Form;
}(_react.Component);

Form.propTypes = {
  children: _propTypes2.default.node.isRequired,
  layout: _propTypes2.default.oneOf(['horizontal', 'vertical', 'elementOnly']),
  className: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.array, _propTypes2.default.object])
};

Form.defaultProps = {
  layout: 'horizontal',
  className: ''
};

exports.default = Form;