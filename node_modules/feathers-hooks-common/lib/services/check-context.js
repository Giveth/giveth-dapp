'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (hook) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var methods = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var label = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'anonymous';

  if (type && hook.type !== type) {
    throw new Error('The \'' + label + '\' hook can only be used as a \'' + type + '\' hook.');
  }

  if (!methods) {
    return;
  }

  var myMethods = Array.isArray(methods) ? methods : [methods]; // safe enough for allowed values

  if (myMethods.length > 0 && myMethods.indexOf(hook.method) === -1) {
    var msg = JSON.stringify(myMethods);
    throw new Error('The \'' + label + '\' hook can only be used on the \'' + msg + '\' service method(s).');
  }
};

module.exports = exports['default'];