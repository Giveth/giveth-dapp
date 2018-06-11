var assert = require('assert');
var duck = require('../lib/rubberduck');

describe('Rubberduck library', function() {
  it('simple punching', function(done) {
    var obj = {
      number: 42,
      method: function() {
        return this.number;
      }
    };

    var emitter = duck.emitter(obj).punch('method');

    emitter.on('before', function() {
      assert.ok(true, "before ran");
    });

    emitter.on('beforeMethod', function(args, context) {
      assert.equal(context.number, 42);
      assert.ok(true, "beforeMethod ran");
      done();
    });

    assert.equal(obj.method(), 42);
  });

  it('punched methods throws', function(done) {
    var totalRuns = 12;
    var obj = {
      syncMethod: function() {
        throw new Error("go apple");
      },
      asyncMethod1: function() {
        throw new Error("go orange");
      },
      asyncMethod2: function(callback) {
        setTimeout(callback.bind(this, new Error("go banana")), 10);
      },
      asyncMethod3: function(callback) {
        callback(new Error("go cucumber"));
      }
    };

    var emitter = duck.emitter(obj).punch('syncMethod');
    emitter.punch(['asyncMethod1', 'asyncMethod2', 'asyncMethod3'], 0);

    var runs = 0;

    emitter.on('before', function() {
      runs++;
      assert.ok(true, "before ran");
    });

    emitter.on('after', function() {
      runs++;
      assert.ok(true, "after ran");
      if (runs == totalRuns) {
        done();
      }
    });

    emitter.on('error', function() {
      runs++;
      assert.ok(true, "error ran");
      if (runs == totalRuns) {
        done();
      }
    });

    try {
      obj.syncMethod();
    } catch (e) {
      runs++;
      assert.ok(e.message == "go apple", "thrown apple caught in the expected portion of user code");
      if (runs == totalRuns) {
        done();
      }
    }
    try {
      obj.asyncMethod1(function() {
        assert.ok(false, "will never run");
      });
    } catch (e) {
      runs++;
      assert.ok(e.message == "go orange", "thrown orange caught in the expected portion of user code");
      if (runs == totalRuns) {
        done();
      }
    }

    obj.asyncMethod2(function(fruit) {
      assert.equal(fruit.message, 'go banana');
      done();
    });

    obj.asyncMethod3(function(err) {
      runs++;
      if (err instanceof Error) assert.ok(true, 'got the error object');
    });
  });

  it('punching strict mode', function() {
    var obj = {
      number: 42,
      zeroLen: function() {
        return this.number;
      },
      oneLen: function(val) {
        return val + this.number;
      },
      twoLen: function(val1, val2) {
        return this.number * val1 / val2;
      }
    };

    duck.emitter(obj).punch(['zeroLen', 'oneLen', 'twoLen'], null, true);

    assert.equal(obj.zeroLen.length, 0, 'zeroLen stays with zero args');
    assert.equal(obj.oneLen.length, 1, 'oneLen keeps its argument length');
    assert.equal(obj.twoLen.length, 2, 'twoLen also keeps its arg len. In zero, one, many context, this should now work perfectly');
  });
});
