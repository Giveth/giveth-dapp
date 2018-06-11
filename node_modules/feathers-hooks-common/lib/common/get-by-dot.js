'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (obj, path) {
  if (path.indexOf('.') === -1) {
    return obj[path];
  }

  return path.split('.').reduce(function (obj1, part) {
    return (typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1)) === 'object' ? obj1[part] : undefined;
  }, obj);
};

module.exports = exports['default'];