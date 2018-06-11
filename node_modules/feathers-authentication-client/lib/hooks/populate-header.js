'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = populateHeader;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
 * Sets the access token in the authorization header
 * under hook.params.header so that it can be picked
 * up by the client side REST libraries.
 */

function populateHeader() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!options.header) {
    throw new Error('You need to pass \'options.header\' to the populateHeader() hook.');
  }

  return function (hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error('The \'populateHeader\' hook should only be used as a \'before\' hook.'));
    }

    if (hook.params.accessToken) {
      hook.params.headers = Object.assign({}, _defineProperty({}, options.header, options.prefix ? options.prefix + ' ' + hook.params.accessToken : hook.params.accessToken), hook.params.headers);
    }

    return Promise.resolve(hook);
  };
}
module.exports = exports['default'];