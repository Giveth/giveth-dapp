'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = function () {
  for (var _len2 = arguments.length, eventFilters = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    eventFilters[_key2] = arguments[_key2];
  }

  return function (_ref) {
    var _ref2 = _slicedToArray(_ref, 3),
        data = _ref2[0],
        connection = _ref2[1],
        hook = _ref2[2];

    var promise = Promise.resolve(data);

    return dispatchFilters(promisify, promise, eventFilters, this, data, connection, hook);
  };
};

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('filters/conditionals');
var ev = 'conditionals'; // todo work needed here before merge with feathers-sockets-common

// https://github.com/feathersjs/feathers-socket-commons/blob/master/src/utils.js#L17-L27
function promisify(method, context) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return new Promise(function (resolve, reject) {
    method.apply(context, args.concat(function (error, result) {
      if (error) {
        return reject(error);
      }

      resolve(result);
    }));
  });
}

// https://github.com/feathersjs/feathers-socket-commons/blob/master/src/events.js
// lines 44-69
var dispatchFilters = function dispatchFilters(promisify, promise, eventFilters, service, data, connection, hook) {
  if (eventFilters.length) {
    eventFilters.forEach(function (filterFn) {
      if (filterFn.length === 4) {
        // function(data, connection, hook, callback)
        promise = promise.then(function (data) {
          if (data) {
            return promisify(filterFn, service, data, connection, hook);
          }

          return data;
        });
      } else {
        // function(data, connection, hook)
        promise = promise.then(function (data) {
          if (data) {
            return filterFn.call(service, data, connection, hook);
          }

          return data;
        });
      }
    });
  }

  promise.catch(function (e) {
    return debug('Error in filter chain for \'' + ev + '\' event', e);
  });

  return promise;
};

module.exports = exports['default'];