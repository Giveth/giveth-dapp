'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _populateHeader = require('./populate-header');

var _populateHeader2 = _interopRequireDefault(_populateHeader);

var _populateAccessToken = require('./populate-access-token');

var _populateAccessToken2 = _interopRequireDefault(_populateAccessToken);

var _populateEntity = require('./populate-entity');

var _populateEntity2 = _interopRequireDefault(_populateEntity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hooks = {
  populateHeader: _populateHeader2.default,
  populateAccessToken: _populateAccessToken2.default,
  populateEntity: _populateEntity2.default
};

exports.default = hooks;
module.exports = exports['default'];