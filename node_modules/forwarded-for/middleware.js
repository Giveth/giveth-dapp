'use strict';

var forwarded = require('./');

/**
 * Add a simple middleware layer.
 *
 * @param {Array} whitelist Whitelist of IP addresses.
 * @returns {Function} The middleware layer.
 * @api public
 */
module.exports = function configure(whitelist) {
  return function middleware(req, res, next) {
    req.forwarded = forwarded(req, req.headers, whitelist);

    next();
  };
};
