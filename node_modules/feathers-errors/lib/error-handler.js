'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options = _extends({}, defaults, options);

  if (typeof options.html === 'undefined') {
    options.html = {
      401: _path2.default.resolve(options.public, '401.html'),
      404: _path2.default.resolve(options.public, '404.html'),
      default: defaultError
    };
  }

  return function (error, req, res, next) {
    if (error.type !== 'FeathersError') {
      var oldError = error;
      error = new _index2.default.GeneralError(oldError.message, {
        errors: oldError.errors
      });

      if (oldError.stack) {
        error.stack = oldError.stack;
      }
    }

    error.code = !isNaN(parseInt(error.code, 10)) ? parseInt(error.code, 10) : 500;
    var formatter = {};

    // If the developer passed a custom function
    if (typeof options.html === 'function') {
      formatter['text/html'] = options.html;
    } else {
      formatter['text/html'] = function () {
        var file = options.html[error.code];

        if (!file) {
          file = options.html.default || defaultError;
        }

        res.set('Content-Type', 'text/html');
        res.sendFile(file);
      };
    }

    // If the developer passed a custom function
    if (typeof options.json === 'function') {
      formatter['application/json'] = options.json;
    } else {
      // Don't show stack trace if it is a 404 error
      if (error.code === 404) {
        error.stack = null;
      }

      formatter['application/json'] = function () {
        var output = _extends({}, error.toJSON());

        if (process.env.NODE_ENV === 'production') {
          delete output.stack;
        }

        res.set('Content-Type', 'application/json');
        res.json(output);
      };
    }

    res.status(error.code);

    var contentType = req.headers['content-type'] || '';
    var accepts = req.headers.accept || '';

    // by default just send back json
    if (contentType.indexOf('json') !== -1 || accepts.indexOf('json') !== -1) {
      formatter['application/json'](error, req, res, next);
    } else if (options.html && (contentType.indexOf('html') !== -1 || accepts.indexOf('html') !== -1)) {
      return formatter['text/html'](error, req, res, next);
    } else {
      // TODO (EK): Maybe just return plain text
      formatter['application/json'](error, req, res, next);
    }
  };
};

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  public: _path2.default.resolve(__dirname, 'public')
};
var defaultError = _path2.default.resolve(defaults.public, 'default.html');

module.exports = exports['default'];