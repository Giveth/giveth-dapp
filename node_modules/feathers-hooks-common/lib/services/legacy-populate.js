'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (target, options) {
  options = Object.assign({}, options);

  console.error('Calling populate(target, options) is now DEPRECATED and will be removed in the future. ' + 'Refer to docs.feathersjs.com for more information. (populate-legacy)');

  if (!options.service) {
    throw new Error('You need to provide a service. (populate)');
  }

  var field = options.field || target;

  return function (hook) {
    function populate1(item) {
      if (!item[field]) {
        return Promise.resolve(item);
      }

      // Find by the field value by default or a custom query
      var id = item[field];

      // If it's a mongoose model then
      if (typeof item.toObject === 'function') {
        item = item.toObject(options);
      } else if (typeof item.toJSON === 'function') {
        // If it's a Sequelize model
        item = item.toJSON(options);
      }
      // Remove any query from params as it's not related
      var params = Object.assign({}, hook.params, { query: undefined });
      // If the relationship is an array of ids, fetch and resolve an object for each,
      // otherwise just fetch the object.
      var promise = Array.isArray(id) ? Promise.all(id.map(function (objectID) {
        return hook.app.service(options.service).get(objectID, params);
      })) : hook.app.service(options.service).get(id, params);
      return promise.then(function (relatedItem) {
        if (relatedItem) {
          item[target] = relatedItem;
        }
        return item;
      });
    }

    if (hook.type !== 'after') {
      throw new errors.GeneralError('Can not populate on before hook. (populate)');
    }

    var isPaginated = hook.method === 'find' && hook.result.data;
    var data = isPaginated ? hook.result.data : hook.result;

    if (Array.isArray(data)) {
      return Promise.all(data.map(populate1)).then(function (results) {
        if (isPaginated) {
          hook.result.data = results;
        } else {
          hook.result = results;
        }

        return hook;
      });
    }

    // Handle single objects.
    return populate1(hook.result).then(function (item) {
      hook.result = item;
      return hook;
    });
  };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = _feathersErrors2.default.errors;

module.exports = exports['default'];