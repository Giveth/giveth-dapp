'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rest;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _wrappers = require('./wrappers');

var _wrappers2 = _interopRequireDefault(_wrappers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-rest');

function formatter(req, res, next) {
  if (res.data === undefined) {
    return next();
  }

  res.format({
    'application/json': function applicationJson() {
      res.json(res.data);
    }
  });
}

function rest() {
  var handler = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : formatter;

  return function () {
    var app = this;

    app.use(function (req, res, next) {
      req.feathers = { provider: 'rest' };
      next();
    });

    app.rest = _wrappers2.default;

    // Register the REST provider
    app.providers.push(function (path, service, options) {
      var uri = path.indexOf('/') === 0 ? path : '/' + path;
      var baseRoute = app.route(uri);
      var idRoute = app.route(uri + '/:__feathersId');

      var middleware = (options || {}).middleware || {};
      var before = middleware.before || [];
      var after = middleware.after || [];

      if (typeof handler === 'function') {
        after = after.concat(handler);
      }

      debug('Adding REST provider for service `' + path + '` at base route `' + uri + '`');

      // GET / -> service.find(cb, params)
      baseRoute.get.apply(baseRoute, before.concat(app.rest.find(service), after));
      // POST / -> service.create(data, params, cb)
      baseRoute.post.apply(baseRoute, before.concat(app.rest.create(service), after));
      // PATCH / -> service.patch(null, data, params)
      baseRoute.patch.apply(baseRoute, before.concat(app.rest.patch(service), after));
      // PUT / -> service.update(null, data, params)
      baseRoute.put.apply(baseRoute, before.concat(app.rest.update(service), after));
      // DELETE / -> service.remove(null, params)
      baseRoute.delete.apply(baseRoute, before.concat(app.rest.remove(service), after));

      // GET /:id -> service.get(id, params, cb)
      idRoute.get.apply(idRoute, before.concat(app.rest.get(service), after));
      // PUT /:id -> service.update(id, data, params, cb)
      idRoute.put.apply(idRoute, before.concat(app.rest.update(service), after));
      // PATCH /:id -> service.patch(id, data, params, callback)
      idRoute.patch.apply(idRoute, before.concat(app.rest.patch(service), after));
      // DELETE /:id -> service.remove(id, params, cb)
      idRoute.delete.apply(idRoute, before.concat(app.rest.remove(service), after));
    });
  };
}

rest.formatter = formatter;
module.exports = exports['default'];