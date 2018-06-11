'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getArguments;

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var noop = exports.noop = function noop() {};
var getCallback = function getCallback(args) {
  var last = args[args.length - 1];
  return typeof last === 'function' ? last : noop;
};
var getParams = function getParams(args, position) {
  return _typeof(args[position]) === 'object' ? args[position] : {};
};

var updateOrPatch = function updateOrPatch(name) {
  return function (args) {
    var id = args[0];
    var data = args[1];
    var callback = getCallback(args);
    var params = getParams(args, 2);

    if (typeof id === 'function') {
      throw new Error('First parameter for \'' + name + '\' can not be a function');
    }

    if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
      throw new Error('No data provided for \'' + name + '\'');
    }

    if (args.length > 4) {
      throw new Error('Too many arguments for \'' + name + '\' service method');
    }

    return [id, data, params, callback];
  };
};

var getOrRemove = function getOrRemove(name) {
  return function (args) {
    var id = args[0];
    var params = getParams(args, 1);
    var callback = getCallback(args);

    if (args.length > 3) {
      throw new Error('Too many arguments for \'' + name + '\' service method');
    }

    if (typeof id === 'function') {
      throw new Error('First parameter for \'' + name + '\' can not be a function');
    }

    return [id, params, callback];
  };
};

var converters = exports.converters = {
  find: function find(args) {
    var callback = getCallback(args);
    var params = getParams(args, 0);

    if (args.length > 2) {
      throw new Error('Too many arguments for \'find\' service method');
    }

    return [params, callback];
  },
  create: function create(args) {
    var data = args[0];
    var params = getParams(args, 1);
    var callback = getCallback(args);

    if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
      throw new Error('First parameter for \'create\' must be an object');
    }

    if (args.length > 3) {
      throw new Error('Too many arguments for \'create\' service method');
    }

    return [data, params, callback];
  },

  update: updateOrPatch('update'),

  patch: updateOrPatch('patch'),

  get: getOrRemove('get'),

  remove: getOrRemove('remove')
};

function getArguments(method, args) {
  return converters[method](args);
}