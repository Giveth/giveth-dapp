'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (items /* modified */, converter) {
  (Array.isArray(items) ? items : [items]).forEach(function (item) {
    traverser(item).forEach(converter); // replacement is in place
  });
};

var traverser = require('traverse');

module.exports = exports['default'];