var assert = require('assert');
var duck = require('../lib/rubberduck');
var events = require('events');

describe('Synchronous function wrapping', function() {
  it('wraps anonymous functions', function(done) {
    // Create an event emitter to attach to the wrapped function
    var emitter = new events.EventEmitter();

    // The function to wrap
    var fn = function() {
      assert.ok(true, 'Fn called');
      return 'asserting';
    };

    var wrapped = duck.wrap.fn(emitter, fn);
    // Emitted before
    emitter.on('before', function(args) {
      assert.equal(args[0], 'assert');
    });
    // Emitted after
    emitter.on('after', function(result) {
      assert.equal(result, 'asserting');
      done();
    });

    assert.equal(wrapped('assert'), 'asserting');
  });

  it('wraps named functions on objects', function(done) {
    var emitter = new events.EventEmitter();

    var fn = function() {
      assert.ok(true, 'Fn called');
      return 'asserting';
    };

    var wrapped = duck.wrap.fn(emitter, fn, false, 'quack');

    emitter.on('before', function(args, context, method) {
      assert.equal(args[0], 'assert');
      assert.equal(method, 'quack');
    });

    emitter.on('beforeQuack', function(args) {
      assert.equal(args[0], 'assert');
    });

    emitter.on('after', function(result, args, context, method) {
      assert.equal(result, 'asserting');
      assert.equal(method, 'quack');
    });

    emitter.on('afterQuack', function(result) {
      assert.equal(result, 'asserting');
      done();
    });

    assert.equal(wrapped('assert'), 'asserting');
  });

  it('wraps keeping the scope', function(done) {
    var obj = {
      number: 42,
      method: function() {
        return this.number;
      }
    };

    var emitter = new events.EventEmitter();

    var wrapped = duck.wrap.fn(emitter, obj.method, false, 'method', obj);

    emitter.on('after', function(result) {
      assert.equal(result, 42);
      done();
    });

    assert.equal(wrapped(), 42);
  });
});
