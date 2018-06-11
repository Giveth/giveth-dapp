'use strict';

/**
 * Module dependencies.
 */

var spark = require('./spark')
  , emitter = require('./emitter')
  , Emitter = emitter()
  , noop = function () {};

/**
 * Export `PrimusEmitter`.
 */

module.exports = PrimusEmitter;

/**
 * Constructor.
 *
 * @param {Primus} primus The primus instance
 * @api public
 */

function PrimusEmitter(primus) {
  primus.$ = primus.$ || {};
  primus.$.emitter = {};
  primus.$.emitter.spark = spark;
  primus.$.emitter.emitter = emitter;
  primus.$.emitter.Emitter = Emitter;

  /**
   * Broadcast the message to all connections.
   *
   * @param {String} ev The event
   * @param {Mixed} [data] The data to broadcast
   * @param {Function} [fn] The callback function
   * @api public
   */

  primus.send = function send(ev, data, fn) {
    var args = arguments;
    primus.forEach(function each(spark) {
      spark.send.apply(spark, args);
    });

    return this;
  };

  return spark(primus.Spark, Emitter);
}

/**
 * Source code for plugin library.
 *
 * @type {String}
 * @api public
 */

PrimusEmitter.library = [
  ';(function (Primus, undefined) {',
    spark.toString(),
    emitter.toString(),
  ' if (undefined === Primus) return;',
  ' Primus.$ = Primus.$ || {};',
  ' Primus.$.emitter = {};',
  ' Primus.$.emitter.spark = spark;',
  ' Primus.$.emitter.emitter = emitter;',
  ' spark(Primus, emitter());',
  '})(Primus);'
].join('\n');

/**
 * Expose server.
 */

PrimusEmitter.server = PrimusEmitter;

/**
 * Expose client.
 */

PrimusEmitter.client = noop;

/**
 * Expose `spark` extend method.
 */

PrimusEmitter.spark = spark;

/**
 * Expose `Emitter`.
 */

PrimusEmitter.Emitter = Emitter;
