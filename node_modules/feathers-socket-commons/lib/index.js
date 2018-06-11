'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMixin;

var _feathersCommons = require('feathers-commons');

var _methods = require('./methods');

var _events = require('./events');

var debug = require('debug')('feathers-socket-commons');

function socketMixin(service) {
  if (typeof service.mixin !== 'function') {
    return;
  }

  service.mixin({
    setup: function setup(app, path) {
      var _this = this;

      if (!this._socketSetup) {
        (function () {
          var info = app._socketInfo;
          var isSubApp = app.mountpath !== '/' && typeof app.mountpath === 'string';
          var mountpath = isSubApp ? app.mountpath : '';
          var fullPath = (0, _feathersCommons.stripSlashes)(mountpath + '/' + path);
          var setupSocket = function setupSocket(socket) {
            _methods.setupMethodHandlers.call(app, info, socket, fullPath, _this);
          };

          debug('Registering socket handlers for service at \'' + fullPath + '\'');

          // Set up event handlers for this service
          _events.setupEventHandlers.call(app, info, fullPath, _this);
          // For a new connection, set up the service method handlers
          info.connection().on('connection', setupSocket);
          // For any existing connection add method handlers
          (0, _feathersCommons.each)(info.clients(), setupSocket);
        })();
      } else {
        debug('Sockets on ' + path + ' already set up');
      }

      this._socketSetup = true;

      if (typeof this._super === 'function') {
        return this._super.apply(this, arguments);
      }
    }
  });
}

function createMixin(property) {
  return function mixin() {
    var app = this;

    app.mixins.push(socketMixin);
    app.mixins.push(_events.filterMixin);

    // When mounted as a sub-app, override the parent setup to call our
    // own setup so the developer doesn't need to call it explicitly.
    app.on('mount', function (parent) {
      var oldSetup = parent.setup;

      parent.setup = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var result = oldSetup.apply(this, args);
        app[property] = parent[property];
        app.setup.apply(app, args);
        return result;
      };
    });
  };
}

createMixin.socketMixin = socketMixin;
module.exports = exports['default'];