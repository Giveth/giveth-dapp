'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, whitelist = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    whitelist[_key - 1] = arguments[_key];
  }

  var params1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var ifWhitelist = !!whitelist.length;
  var params = Object.assign({}, params1);

  params.query = params.query || {};
  params.query.$client = params.query.$client || {};

  Object.keys(params).forEach(function (key) {
    if (key !== 'query') {
      if (!ifWhitelist || whitelist.includes(key)) {
        params.query.$client[key] = params[key];
      }

      delete params[key];
    }
  });

  return params;
};

module.exports = exports['default'];