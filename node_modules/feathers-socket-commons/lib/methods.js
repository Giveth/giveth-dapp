'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.paramsPositions = undefined;
exports.setupMethodHandlers = setupMethodHandlers;

var _feathersCommons = require('feathers-commons');

var _utils = require('./utils');

var debug = require('debug')('feathers-socket-commons:methods');

// The position of the params parameters for a service method so that we can extend them
// default is 1
var paramsPositions = exports.paramsPositions = {
  find: 0,
  update: 2,
  patch: 2
};

// Set up all method handlers for a service and socket.
function setupMethodHandlers(info, socket, path, service) {
  this.methods.forEach(function (method) {
    if (typeof service[method] !== 'function') {
      return;
    }

    var name = path + '::' + method;
    var connection = info.params(socket);
    var position = typeof paramsPositions[method] !== 'undefined' ? paramsPositions[method] : 1;

    debug('Setting up socket listener for event \'' + name + '\'');

    socket.on(name, function () {
      var _arguments = arguments;

      debug('Got \'' + name + '\' event with connection', connection);

      try {
        (function () {
          var args = (0, _feathersCommons.getArguments)(method, (0, _utils.normalizeArgs)(_arguments));
          var callback = args[args.length - 1];

          // NOTE (EK): socket.io just bombs silently if there is an error that
          // isn’t up to it’s standards, so you we inject a new error handler
          // to print a debug log and clean up the error object so it actually
          // gets transmitted back to the client.
          args[position] = Object.assign({ query: args[position] }, connection);
          args[args.length - 1] = function (error, data) {
            if (error) {
              debug('Error calling ' + name, error);
              return callback((0, _utils.normalizeError)(error));
            }

            callback(error, data);
          };

          service[method].apply(service, args);
        })();
      } catch (e) {
        var callback = arguments[arguments.length - 1];
        debug('Error on socket', e);
        if (typeof callback === 'function') {
          callback((0, _utils.normalizeError)(e));
        }
      }
    });
  });
}