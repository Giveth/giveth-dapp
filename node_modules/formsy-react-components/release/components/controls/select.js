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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SelectControl = function (_Component) {
  _inherits(SelectControl, _Component);

  function SelectControl() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, SelectControl);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = SelectControl.__proto__ || Object.getPrototypeOf(SelectControl)).call.apply(_ref, [this].concat(args))), _this), _this.initElementRef = function (element) {
      _this.element = element;
    }, _this.renderOption = function (item, key) {
      var optionProps = Object.assign({}, item);
      delete optionProps.label;
      delete optionProps.group;
      return _react2.default.createElement(
        'option',
        _extends({ key: key }, optionProps),
        item.label
      );
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(SelectControl, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var options = this.props.options;


      var groups = options.filter(function (item) {
        return item.group;
      }).map(function (item) {
        return item.group;
      });
      // Get the unique items in group.
      groups = [].concat(_toConsumableArray(new Set(groups)));

      var optionNodes = [];

      if (groups.length === 0) {
        // eslint-disable-next-line react/no-array-index-key
        optionNodes = options.map(function (item, index) {
          return _this2.renderOption(item, index);
        });
      } else {
        // For items without groups.
        var itemsWithoutGroup = options.filter(function (item) {
          return !item.group;
        });

        itemsWithoutGroup.forEach(function (item, index) {
          // eslint-disable-next-line react/no-array-index-key
          optionNodes.push(_this2.renderOption(item, 'no-group-' + index));
        });

        groups.forEach(function (group, groupIndex) {
          var groupItems = options.filter(function (item) {
            return item.group === group;
          });

          var groupOptionNodes = groupItems.map(function (item, index) {
            return _this2.renderOption(item, groupIndex + '-' + index);
          });

          /* eslint-disable react/no-array-index-key */
          optionNodes.push(_react2.default.createElement(
            'optgroup',
            { label: group, key: groupIndex },
            groupOptionNodes
          ));
          /* eslint-enable */
        });
      }

      var selectProps = Object.assign({}, this.props);
      delete selectProps.options;

      return _react2.default.createElement(
        'select',
        _extends({
          className: 'form-control'
        }, selectProps, {
          ref: this.initElementRef }),
        optionNodes
      );
    }
  }]);

  return SelectControl;
}(_react.Component);

SelectControl.propTypes = _extends({}, _controlCommon2.default.propTypes, {
  options: _propTypes2.default.arrayOf(_propTypes2.default.shape({
    value: _propTypes2.default.string,
    label: _propTypes2.default.string,
    group: _propTypes2.default.string
  })).isRequired,
  multiple: _propTypes2.default.bool
});

SelectControl.defaultProps = {
  multiple: false
};

exports.default = SelectControl;