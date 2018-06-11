"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (obj) {
  var values = [];
  Object.keys(obj).forEach(function (key) {
    return values.push(obj[key]);
  });
  return values;
};