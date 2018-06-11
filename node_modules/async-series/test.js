var test = require('tape')
  , series = require('./')

test('series', function(t) {
  t.plan(3)

  var total = 100
    , captured = 0
    , tasks = []
    , syncReady = false
    , asyncReady = false

  for (var i = 0; i < total; i += 1) {
    tasks.push(function(done) { captured += 1; done() })
  }

  series(tasks, function() {
    // should be sync unless specified
    t.equal(syncReady, false)

    // runs the expected amount of times
    t.equal(total, captured)
  })
  syncReady = true

  series(tasks, function() {
    // should be forced async
    t.equal(asyncReady, true)
  }, true)
  asyncReady = true
})

test('order', function(t) {
  var a = false
    , b = false
    , c = false

  t.plan(9)

  series([function(done) {
    a = true
    t.equal(b, false)
    t.equal(c, false)
    done()
  }, function(done) {
    b = true
    t.equal(a, true)
    t.equal(c, false)
    done()
  }, function(done) {
    c = true
    t.equal(a, true)
    t.equal(b, true)
    done()
  }], function() {
    t.equal(a, true)
    t.equal(b, true)
    t.equal(c, true)
  })
})

test('errors', function(t) {
  var a = false
    , b = false
    , c = false

  t.plan(5)

  series([function(done) {
    a = true
    done()
  }, function(done) {
    b = true
    done(new Error('ending'))
  }, function(done) {
    c = true
    done()
  }], function(err) {
    t.ok(err)
    t.equal(err.message, 'ending')
    t.equal(a, true)
    t.equal(b, true)
    t.equal(c, false)
  })
})