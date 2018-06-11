'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _feathersErrors = require('feathers-errors');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('feathers-socket-commons:client');
var namespacedEmitterMethods = ['addListener', 'emit', 'listenerCount', 'listeners', 'on', 'once', 'prependListener', 'prependOnceListener', 'removeAllListeners', 'removeListener'];
var otherEmitterMethods = ['eventNames', 'getMaxListeners', 'setMaxListeners'];

var addEmitterMethods = function addEmitterMethods(service) {
  otherEmitterMethods.forEach(function (method) {
    service[method] = function () {
      var _connection;

      if (typeof this.connection[method] !== 'function') {
        throw new Error('Can not call \'' + method + '\' on the client service connection.');
      }

      return (_connection = this.connection)[method].apply(_connection, arguments);
    };
  });

  namespacedEmitterMethods.forEach(function (method) {
    service[method] = function (name) {
      var _connection2;

      if (typeof this.connection[method] !== 'function') {
        throw new Error('Can not call \'' + method + '\' on the client service connection.');
      }

      var eventName = this.path + ' ' + name;

      debug('Calling emitter method ' + method + ' with ' + ('namespaced event \'' + eventName + '\''));

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var result = (_connection2 = this.connection)[method].apply(_connection2, [eventName].concat(args));

      return result === this.connection ? this : result;
    };
  });
};

var Service = function () {
  function Service(options) {
    _classCallCheck(this, Service);

    this.events = _utils.events;
    this.path = options.name;
    this.connection = options.connection;
    this.method = options.method;
    this.timeout = options.timeout || 5000;

    addEmitterMethods(this);
  }

  _createClass(Service, [{
    key: 'send',
    value: function send(method) {
      var _this = this;

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var callback = null;
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }

      return new Promise(function (resolve, reject) {
        var _connection3;

        var event = _this.path + '::' + method;
        var timeoutId = setTimeout(function () {
          return reject(new Error('Timeout of ' + _this.timeout + 'ms exceeded calling ' + event));
        }, _this.timeout);

        args.unshift(event);
        args.push(function (error, data) {
          error = (0, _feathersErrors.convert)(error);
          clearTimeout(timeoutId);

          if (callback) {
            callback(error, data);
          }

          return error ? reject(error) : resolve(data);
        });

        debug('Sending socket.' + _this.method, args);

        (_connection3 = _this.connection)[_this.method].apply(_connection3, args);
      });
    }
  }, {
    key: 'find',
    value: function find() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.send('find', params.query || {});
    }
  }, {
    key: 'get',
    value: function get(id) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.send('get', id, params.query || {});
    }
  }, {
    key: 'create',
    value: function create(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.send('create', data, params.query || {});
    }
  }, {
    key: 'update',
    value: function update(id, data) {
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.send('update', id, data, params.query || {});
    }
  }, {
    key: 'patch',
    value: function patch(id, data) {
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.send('patch', id, data, params.query || {});
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.send('remove', id, params.query || {});
    }
  }, {
    key: 'off',
    value: function off(name) {
      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      if (typeof this.connection.off === 'function') {
        var _connection4;

        return (_connection4 = this.connection).off.apply(_connection4, [this.path + ' ' + name].concat(args));
      } else if (args.length === 0) {
        return this.removeAllListeners(name);
      }

      return this.removeListener.apply(this, [name].concat(args));
    }
  }]);

  return Service;
}();

exports.default = Service;
module.exports = exports['default'];