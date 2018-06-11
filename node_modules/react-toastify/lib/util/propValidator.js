'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.falseOrElement = exports.falseOrNumber = undefined;
exports.typeOf = typeOf;
exports.isValidDelay = isValidDelay;

var _react = require('react');

function typeOf(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

function isValidDelay(val) {
  return typeOf(val) === 'Number' && !isNaN(val) && val > 0;
}

function withRequired(fn) {
  fn.isRequired = function (props, propName, componentName) {
    var prop = props[propName];

    if (typeof prop === 'undefined') {
      return new Error('The prop ' + propName + ' is marked as required in \n      ' + componentName + ', but its value is undefined.');
    }

    fn(props, propName, componentName);
  };
  return fn;
}

/**
 * TODO: Maybe rethink about the name
 */
var falseOrNumber = exports.falseOrNumber = withRequired(function (props, propName, componentName) {
  var prop = props[propName];

  if (prop !== false && !isValidDelay(prop)) {
    return new Error(componentName + ' expect ' + propName + ' \n      to be a valid Number > 0 or equal to false. ' + prop + ' given.');
  }

  return null;
});

var falseOrElement = exports.falseOrElement = withRequired(function (props, propName, componentName) {
  var prop = props[propName];

  if (prop !== false && !(0, _react.isValidElement)(prop)) {
    return new Error(componentName + ' expect ' + propName + ' \n      to be a valid react element or equal to false. ' + prop + ' given.');
  }

  return null;
});