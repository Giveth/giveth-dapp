'use strict';

/**
 * Simple abstraction to merge the awfully emitted `error` events for listening
 * to a callback.
 *
 * ```js
 * var app = require('net').createServer();
 * require('listening')(app, function (err) {
 *   .. handle listen errors here ..
 * });
 * ```
 *
 * @api public
 */
module.exports = function listen() {
  var args = Array.prototype.slice.call(arguments, 0)
    , server = args.shift()
    , fn = args.pop();

  /**
   * The actual callback method that is passed in to the server which collects
   * the different events and passes it to the given callback method.
   *
   * @param {Error}
   * @api private
   */
  function collector(err) {
    server.removeListener('error', collector);
    server.removeListener('listening', collector);

    if (fn) fn.apply(server, arguments);
    else if (err) throw err;
  }

  //
  // Allow people to supply the server with no callback function.
  //
  if ('function' !== typeof fn) {
    args.push(fn);
    fn = null;
  }

  server.once('listening', collector);
  server.once('error', collector);

  return server.listen.apply(server, args);
};
