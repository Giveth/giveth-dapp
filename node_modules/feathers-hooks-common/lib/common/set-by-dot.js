'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (obj, path, value, ifDelete) {
  if (ifDelete) {
    console.log('DEPRECATED. Use deleteByDot instead of setByDot(obj,path,value,true). (setByDot)');
  }

  if (path.indexOf('.') === -1) {
    obj[path] = value;

    if (value === undefined && ifDelete) {
      delete obj[path];
    }

    return;
  }

  var parts = path.split('.');
  var lastIndex = parts.length - 1;
  return parts.reduce(function (obj1, part, i) {
    if (i !== lastIndex) {
      if (!obj1.hasOwnProperty(part) || _typeof(obj1[part]) !== 'object') {
        obj1[part] = {};
      }
      return obj1[part];
    }

    obj1[part] = value;
    if (value === undefined && ifDelete) {
      delete obj1[part];
    }
    return obj1;
  }, obj);
};

module.exports = exports['default'];