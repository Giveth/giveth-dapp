module.exports = function emitter() {
  'use strict';

  var toString = Object.prototype.toString
    , slice = Array.prototype.slice;

  /**
   * Check if the given `value` is an `Array`.
   *
   * @param {*} value The value to check
   * @return {Boolean}
   */

  var isArray = Array.isArray || function isArray(value) {
    return '[object Array]' === toString.call(value);
  };

  /**
   * Event packets.
   */

  var packets = {
    EVENT:  0,
    ACK:    1
  };

  /**
   * Initialize a new `Emitter`.
   *
   * @param {Primus|Spark} conn
   * @return {Emitter} `Emitter` instance
   * @api public
   */

  function Emitter(conn) {
    if (!(this instanceof Emitter)) return new Emitter(conn);
    this.ids = 1;
    this.acks = {};
    this.conn = conn;
    if (this.conn) this.bind();
  }

  /**
   * Bind `Emitter` events.
   *
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.bind = function bind() {
    var em = this;
    this.conn.on('data', function ondata(packet) {
      em.ondata.call(em, packet);
    });
    return this;
  };

  /**
   * Called with incoming transport data.
   *
   * @param {Object} packet
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.ondata = function ondata(packet) {
    if (!isArray(packet.data) || packet.id && 'number' !== typeof packet.id) {
      return this;
    }
    switch (packet.type) {
      case packets.EVENT:
        this.onevent(packet);
        break;
      case packets.ACK:
        this.onack(packet);
    }
    return this;
  };

  /**
   * Send a message to client.
   *
   * @return {Emitter} self
   * @api public
   */

  Emitter.prototype.send = function send() {
    var args = slice.call(arguments);
    this.conn.write(this.packet(args));
    return this;
  };

  /**
   * Prepare packet for emitting.
   *
   * @param {Array} arguments
   * @return {Object} packet
   * @api private
   */

  Emitter.prototype.packet = function pack(args) {
    var packet = { type: packets.EVENT, data: args };
    // access last argument to see if it's an ACK callback
    if ('function' === typeof args[args.length - 1]) {
      var id = this.ids++;
      this.acks[id] = args.pop();
      packet.id = id;
    }
    return packet;
  };

  /**
   * Called upon event packet.
   *
   * @param {Object} packet object
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.onevent = function onevent(packet) {
    var args = packet.data;
    if (this.conn.reserved(args[0])) return this;
    if (packet.id) args.push(this.ack(packet.id));
    this.conn.emit.apply(this.conn, args);
    return this;
  };

  /**
   * Produces an ack callback to emit with an event.
   *
   * @param {Number} packet id
   * @return {Function}
   * @api private
   */

  Emitter.prototype.ack = function ack(id) {
    var conn = this.conn
      , sent = false;
    return function () {
      if (sent) return; // prevent double callbacks
      sent = true;
      conn.write({
        id: id,
        type: packets.ACK,
        data: slice.call(arguments)
      });
    };
  };

  /**
   * Called upon ack packet.
   *
   * @param {Object} packet object
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.onack = function onack(packet) {
    var ack = this.acks[packet.id];
    if ('function' === typeof ack) {
      ack.apply(this, packet.data);
      delete this.acks[packet.id];
    }
    return this;
  };

  // Expose packets
  Emitter.packets = packets;

  return Emitter;
};
