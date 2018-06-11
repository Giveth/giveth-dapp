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

var _formsyReact = require('formsy-react');

var _propTypes3 = require('../components/prop-types');

var _propTypes4 = _interopRequireDefault(_propTypes3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getDisplayName(component) {
  return component.displayName || component.name || (typeof component === 'string' ? component : 'Component');
}

// Component HOC
// -------------
//
// This HOC provides shared code for our form components.
//
// We use this to merge props set using our OptionsProvider, so that
// we can set commonly used props on an enclosing component.
//
// This allows us to set these properties 'as a whole' for each component in the
// the form, while retaining the ability to override the prop on a per-component
// basis.
var FormsyReactComponent = function FormsyReactComponent(ComposedComponent) {
  var ComponentHOC = function (_Component) {
    _inherits(ComponentHOC, _Component);

    function ComponentHOC() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, ComponentHOC);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = ComponentHOC.__proto__ || Object.getPrototypeOf(ComponentHOC)).call.apply(_ref, [this].concat(args))), _this), _this.getLayout = function () {
        return _this.props.layout || _this.context.layout || 'horizontal';
      }, _this.getValidatePristine = function () {
        if (typeof _this.props.validatePristine === 'boolean') {
          return _this.props.validatePristine;
        }
        return _this.context.validatePristine || false;
      }, _this.getValidateOnSubmit = function () {
        if (typeof _this.props.validateOnSubmit === 'boolean') {
          return _this.props.validateOnSubmit;
        }
        return _this.context.validateOnSubmit || false;
      }, _this.getId = function () {
        var _this$props = _this.props,
            id = _this$props.id,
            label = _this$props.label,
            name = _this$props.name;

        if (id !== '') {
          return id;
        }
        return ['frc', name.split('[').join('_').replace(']', ''), _this.hashString(JSON.stringify(label))].join('-');
      }, _this.combineContextWithProp = function (key) {
        return [_this.context[key], _this.props[key]];
      }, _this.hashString = function (string) {
        var hash = 0;
        for (var i = 0; i < string.length; i += 1) {
          // eslint-disable-next-line no-bitwise
          hash = (hash << 5) - hash + string.charCodeAt(i) & 0xffffffff;
        }
        return hash;
      }, _this.shouldShowErrors = function () {
        if (_this.props.isPristine() === true) {
          if (_this.getValidatePristine() === false) {
            return false;
          }
        }
        if (_this.getValidateOnSubmit() === true) {
          if (_this.props.isFormSubmitted() === false) {
            return false;
          }
        }
        return _this.props.isValid() === false;
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }
    // Use the following value for layout:
    // 1. layout prop (if supplied)
    // 2. [else] layout context (if defined)
    // 3. [else] 'horizontal' (default value)


    // Use the following value for validatePristine:
    // 1. validatePristine prop (if supplied)
    // 2. [else] validatePristine context (if defined)
    // 3. [else] false (default value)


    // Use the following value for validateOnSubmit:
    // 1. validateOnSubmit prop (if supplied)
    // 2. [else] validateOnSubmit context (if defined)
    // 3. [else] false (default value)


    // getId
    // -----
    //
    // The ID is used as an attribute on the form control, and is used to allow
    // associating the label element with the form control.
    //
    // If we don't explicitly pass an `id` prop, we generate one based on the
    // `name` and `label` properties.


    // Combine a parent context value with a component prop value.
    // This is used for CSS classnames, where the value is passed to `JedWatson/classnames`.


    // Determine whether to show errors, or not.


    _createClass(ComponentHOC, [{
      key: 'render',


      // We pass through all unknown props, but delete some formsy HOC props
      // that we know we don't need.
      value: function render() {
        var props = _extends({}, this.props, {
          elementWrapperClassName: this.combineContextWithProp('elementWrapperClassName'),
          labelClassName: this.combineContextWithProp('labelClassName'),
          rowClassName: this.combineContextWithProp('rowClassName'),
          disabled: this.props.isFormDisabled() || this.props.disabled,
          errorMessages: this.props.getErrorMessages(),
          id: this.getId(),
          isPristine: this.props.isPristine,
          layout: this.getLayout(),
          ref: this.props.componentRef,
          required: this.props.isRequired(),
          showErrors: this.shouldShowErrors(),
          value: this.props.getValue(),
          onSetValue: this.props.setValue
        });

        // Props that we don't need to pass to our composed components.
        var unusedPropNames = [
        // From formsy-react HOC...
        'getErrorMessage', 'getErrorMessages', 'getValue', 'hasValue', 'isFormDisabled', 'isFormSubmitted', 'isRequired', 'isValid', 'isValidValue', 'resetValue', 'setValidations', 'setValue', 'showError', 'showRequired', 'validationError', 'validationErrors', 'validations', 'innerRef',
        // From formsy-react-component HOC...
        'componentRef', 'validateOnSubmit', 'validatePristine'];

        unusedPropNames.forEach(function (propName) {
          delete props[propName];
        });

        return _react2.default.createElement(ComposedComponent, props);
      }
    }]);

    return ComponentHOC;
  }(_react.Component);

  ComponentHOC.propTypes = _extends({
    // These are the props that we require from the formsy-react HOC.
    getErrorMessages: _propTypes2.default.func.isRequired,
    getValue: _propTypes2.default.func.isRequired,
    isFormDisabled: _propTypes2.default.func.isRequired,
    isPristine: _propTypes2.default.func.isRequired,
    isRequired: _propTypes2.default.func.isRequired,
    isValid: _propTypes2.default.func.isRequired,
    setValue: _propTypes2.default.func.isRequired
  }, _propTypes4.default, {

    name: _propTypes2.default.string.isRequired,
    disabled: _propTypes2.default.bool,

    // Composed components expect this to be a string.
    help: _propTypes2.default.string,

    id: _propTypes2.default.string,
    label: _propTypes2.default.node,
    layout: _propTypes2.default.string,

    // * validateOnSubmit
    // * validatePristine
    //
    // Neither of these props actually stop the validations from running,
    // they just determine whether the error messages should be shown on
    // components or not.

    // Whether to hide validation errors on components before the form is
    // submitted.
    validateOnSubmit: _propTypes2.default.bool,

    // Whether to show validation errors on pristine (untouched) components.
    validatePristine: _propTypes2.default.bool
  });

  ComponentHOC.contextTypes = _extends({}, _propTypes4.default, {
    layout: _propTypes2.default.string,
    validateOnSubmit: _propTypes2.default.bool,
    validatePristine: _propTypes2.default.bool
  });

  // TODO: Should we add default props for the following?:
  // * elementWrapperClassName
  // * labelClassName
  // * rowClassName

  // The following props get their default values by first looking for props in the parent context.
  // * layout (See getLayout, defaults to 'horizontal')
  // * validatePristine: (See getValidatePristine, defaults to 'false'),
  // * validateOnSubmit: (See getValidateOnSubmit, defaults to 'false'),
  ComponentHOC.defaultProps = {
    disabled: false,
    help: '',
    id: '',
    label: '',
    layout: '',
    validateOnSubmit: null,
    validatePristine: null
  };

  ComponentHOC.displayName = 'withFRC(' + getDisplayName(ComposedComponent) + ')';

  return (0, _formsyReact.withFormsy)(ComponentHOC);
};

exports.default = FormsyReactComponent;