'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (hook) {
  var items = hook.type === 'before' ? hook.data : hook.result;
  return items && hook.method === 'find' ? items.data || items : items;
};

module.exports = exports['default'];