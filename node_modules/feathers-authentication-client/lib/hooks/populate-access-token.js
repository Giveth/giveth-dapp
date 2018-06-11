'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = populateAccessToken;
/*
 * Exposes the access token to the client side hooks
 * under hook.params.accessToken.
 */

function populateAccessToken() {
  return function (hook) {
    var app = hook.app;

    if (hook.type !== 'before') {
      return Promise.reject(new Error('The \'populateAccessToken\' hook should only be used as a \'before\' hook.'));
    }

    Object.assign(hook.params, { accessToken: app.get('accessToken') });

    return Promise.resolve(hook);
  };
}
module.exports = exports['default'];