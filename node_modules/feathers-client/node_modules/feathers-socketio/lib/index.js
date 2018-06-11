'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (port, options, config) {
  if (typeof port !== 'number') {
    config = options;
    options = port;
    port = null;
  }

  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
    config = options;
    options = {};
  }

  return function () {
    var app = this;

    app.configure((0, _feathersSocketCommons2.default)('io'));

    _uberproto2.default.mixin({
      setup: function setup(server) {
        var io = this.io;

        if (!io) {
          io = this.io = _socket2.default.listen(port || server, options);

          io.use(function (socket, next) {
            socket.feathers = { provider: 'socketio' };
            next();
          });
        }

        this._socketInfo = {
          method: 'emit',
          connection: function connection() {
            return io.sockets;
          },
          clients: function clients() {
            return io.sockets.sockets;
          },
          params: function params(socket) {
            return socket.feathers;
          }
        };

        // In Feathers it is easy to hit the standard Node warning limit
        // of event listeners (e.g. by registering 10 services).
        // So we set it to a higher number. 64 should be enough for everyone.
        this._socketInfo.connection().setMaxListeners(64);

        if (typeof config === 'function') {
          debug('Calling SocketIO configuration function');
          config.call(this, io);
        }

        return this._super.apply(this, arguments);
      }
    }, app);
  };
};

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _feathersSocketCommons = require('feathers-socket-commons');

var _feathersSocketCommons2 = _interopRequireDefault(_feathersSocketCommons);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-socketio');

module.exports = exports['default'];