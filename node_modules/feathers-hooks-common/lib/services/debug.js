'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (msg) {
  return function (context) {
    console.log('* ' + (msg || '') + '\ntype:' + context.type + ', method: ' + context.method);
    if (context.data) {
      console.log('data:', context.data);
    }
    if (context.params && context.params.query) {
      console.log('query:', context.params.query);
    }
    if (context.result) {
      console.log('result:', context.result);
    }
    if (context.error) {
      console.log('error', context.error);
    }
  };
};

module.exports = exports['default'];