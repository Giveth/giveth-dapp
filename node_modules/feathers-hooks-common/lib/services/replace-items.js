'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (hook, items) {
  if (hook.type === 'before') {
    hook.data = items;
  } else if (hook.method === 'find' && hook.result && hook.result.data) {
    hook.result.data = Array.isArray(items) ? items : [items];
  } else {
    hook.result = items;
  }
};

module.exports = exports['default'];