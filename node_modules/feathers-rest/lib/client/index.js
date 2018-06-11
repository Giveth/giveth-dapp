'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var result = {};

  Object.keys(transports).forEach(function (key) {
    var Service = transports[key];

    result[key] = function (connection) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!connection) {
        throw new Error(key + ' has to be provided to feathers-rest');
      }

      var defaultService = function defaultService(name) {
        return new Service({ base: base, name: name, connection: connection, options: options });
      };

      var initialize = function initialize() {
        if (typeof this.defaultService === 'function') {
          throw new Error('Only one default client provider can be configured');
        }

        this.rest = connection;
        this.defaultService = defaultService;
      };

      initialize.Service = Service;
      initialize.service = defaultService;

      return initialize;
    };
  });

  return result;
};

var _jquery = require('./jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _superagent = require('./superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _fetch = require('./fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _axios = require('./axios');

var _axios2 = _interopRequireDefault(_axios);

var _angular = require('./angular');

var _angular2 = _interopRequireDefault(_angular);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var transports = {
  jquery: _jquery2.default,
  superagent: _superagent2.default,
  request: _request2.default,
  fetch: _fetch2.default,
  axios: _axios2.default,
  angular: _angular2.default
};

module.exports = exports['default'];