'use strict';

var prefix = require('eventemitter3').prefixed
  , toString = Object.prototype.toString
  , slice = Array.prototype.slice;

/**
 * Get an accurate type description of whatever we receive.
 *
 * @param {Mixed} what What ever we receive
 * @returns {String} Description of what ever it is.
 * @api private
 */
function type(what) {
  return toString.call(what).slice(8, -1).toLowerCase();
}

/**
 * Asynchronously emit an event.
 *
 * @param {String} event Name of the event that should be emitted.
 * @param {Arguments} .. Arguments for the emit function.
 * @param {Function} fn Completion callback for when all is emitted.
 * @returns {Self}
 * @api public
 */
module.exports = function asyncemit() {
  var args = slice.call(arguments, 0)
    , event = args.shift()
    , async = args.length
    , fn = args.pop()
    , selfie = this
    , listeners;

  listeners = (this._events || {})[prefix ? prefix + event : event];

  if (!listeners) return fn(), this;
  if (type(listeners) !== 'array') listeners = [ listeners ];

  /**
   * Simple async helper utility.
   *
   * @param {Array} stack The listeners for the specified event.
   * @api private
   */
  (function each(stack) {
    if (!stack.length) return fn();

    var listener = stack.shift();

    if (listener.once) {
      selfie.removeListener(event, listener.fn);
    }

    if (listener.fn.length !== async) {
      listener.fn.apply(listener.context, args);
      return each(stack);
    }

    //
    // Async operation
    //
    listener.fn.apply(
      listener.context,
      args.concat(function done(err) {
        if (err) return fn(err);

        each(stack);
      })
    );
  })(listeners.slice());

  return this;
};
