'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (obj, path) {
  var parts = path.split('.');
  var nonLeafLen = parts.length - 1;

  for (var i = 0; i < nonLeafLen; i++) {
    var part = parts[i];
    if (!(part in obj)) {
      return;
    }

    obj = obj[part];

    if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || obj === null) {
      throw new _feathersErrors2.default.BadRequest('Path \'' + path + '\' does not exist. (deleteByDot)');
    }
  }

  delete obj[parts[nonLeafLen]];
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];