'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isHookObject = isHookObject;
exports.processHooks = processHooks;
exports.addHookTypes = addHookTypes;
exports.getHooks = getHooks;
exports.baseMixin = baseMixin;

var _feathersCommons = require('feathers-commons');

function isHookObject(hookObject) {
  return (typeof hookObject === 'undefined' ? 'undefined' : _typeof(hookObject)) === 'object' && typeof hookObject.method === 'string' && typeof hookObject.type === 'string';
}

function processHooks(hooks, initialHookObject) {
  var _this = this;

  var hookObject = initialHookObject;
  var updateCurrentHook = function updateCurrentHook(current) {
    if (current) {
      if (!isHookObject(current)) {
        throw new Error(hookObject.type + ' hook for \'' + hookObject.method + '\' method returned invalid hook object');
      }

      hookObject = current;
    }

    return hookObject;
  };
  var promise = Promise.resolve(hookObject);

  // Go through all hooks and chain them into our promise
  hooks.forEach(function (fn) {
    var hook = fn.bind(_this);

    if (hook.length === 2) {
      // function(hook, next)
      promise = promise.then(function (hookObject) {
        return new Promise(function (resolve, reject) {
          hook(hookObject, function (error, result) {
            return error ? reject(error) : resolve(result);
          });
        });
      });
    } else {
      // function(hook)
      promise = promise.then(hook);
    }

    // Use the returned hook object or the old one
    promise = promise.then(updateCurrentHook);
  });

  return promise.catch(function (error) {
    // Add the hook information to any errors
    error.hook = hookObject;
    throw error;
  });
}

function addHookTypes(target) {
  var types = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ['before', 'after', 'error'];

  Object.defineProperty(target, '__hooks', {
    value: {}
  });

  types.forEach(function (type) {
    // Initialize properties where hook functions are stored
    target.__hooks[type] = {};
  });
}

function getHooks(app, service, type, method) {
  var appLast = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

  var appHooks = app.__hooks[type][method] || [];
  var serviceHooks = service.__hooks[type][method] || [];

  if (appLast) {
    return serviceHooks.concat(appHooks);
  }

  return appHooks.concat(serviceHooks);
}

function baseMixin(methods) {
  var mixin = {
    hooks: function hooks(allHooks) {
      var _this2 = this;

      (0, _feathersCommons.each)(allHooks, function (obj, type) {
        if (!_this2.__hooks[type]) {
          throw new Error('\'' + type + '\' is not a valid hook type');
        }

        var hooks = _feathersCommons.hooks.convertHookData(obj);

        (0, _feathersCommons.each)(hooks, function (value, method) {
          if (method !== 'all' && methods.indexOf(method) === -1) {
            throw new Error('\'' + method + '\' is not a valid hook method');
          }
        });

        methods.forEach(function (method) {
          if (!(hooks[method] || hooks.all)) {
            return;
          }

          var myHooks = _this2.__hooks[type][method] || (_this2.__hooks[type][method] = []);

          if (hooks.all) {
            myHooks.push.apply(myHooks, hooks.all);
          }

          if (hooks[method]) {
            myHooks.push.apply(myHooks, hooks[method]);
          }
        });
      });

      return this;
    }
  };

  for (var _len = arguments.length, objs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    objs[_key - 1] = arguments[_key];
  }

  return Object.assign.apply(Object, [mixin].concat(objs));
}