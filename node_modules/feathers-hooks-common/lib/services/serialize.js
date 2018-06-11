'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (schema1) {
  return function (hook) {
    var schema = typeof schema1 === 'function' ? schema1(hook) : schema1;
    var schemaDirectives = ['computed', 'exclude', 'only'];

    (0, _replaceItems2.default)(hook, serializeItems((0, _getItems2.default)(hook), schema));
    return hook;

    function serializeItems(items, schema) {
      if (!Array.isArray(items)) {
        return serializeItem(items, schema);
      }

      return items.map(function (item) {
        return serializeItem(item, schema);
      });
    }

    function serializeItem(item, schema) {
      var computed = {};
      Object.keys(schema.computed || {}).forEach(function (name) {
        computed[name] = schema.computed[name](item, hook); // needs closure
      });

      var only = schema.only;
      only = typeof only === 'string' ? [only] : only;
      if (only) {
        var newItem = {};
        only.concat('_include', '_elapsed', item._include || []).forEach(function (key) {
          var value = (0, _getByDot2.default)(item, key);
          if (value !== undefined) {
            (0, _setByDot2.default)(newItem, key, value);
          }
        });
        item = newItem;
      }

      var exclude = schema.exclude;
      exclude = typeof exclude === 'string' ? [exclude] : exclude;
      if (exclude) {
        exclude.forEach(function (key) {
          (0, _deleteByDot2.default)(item, key);
        });
      }

      var _computed = Object.keys(computed);
      item = Object.assign({}, item, computed, _computed.length ? { _computed: _computed } : {});

      Object.keys(schema).forEach(function (key) {
        if (!schemaDirectives.includes(key) && _typeof(item[key]) === 'object') {
          // needs closure
          item[key] = serializeItems(item[key], schema[key]);
        }
      });

      return item;
    }
  };
};

var _getByDot = require('../common/get-by-dot');

var _getByDot2 = _interopRequireDefault(_getByDot);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

var _replaceItems = require('./replace-items');

var _replaceItems2 = _interopRequireDefault(_replaceItems);

var _setByDot = require('../common/set-by-dot');

var _setByDot2 = _interopRequireDefault(_setByDot);

var _deleteByDot = require('../common/delete-by-dot');

var _deleteByDot2 = _interopRequireDefault(_deleteByDot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];