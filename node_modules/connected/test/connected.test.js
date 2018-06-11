describe('connected', function () {
  'use strict';

  var connected = require('../')
    , assume = require('assume')
    , net = require('net')
    , server;

  beforeEach(function () {
    server = net.createServer();
  });

  afterEach(function (next) {
    try { server.close(next); }
    catch (e) { next(); }
  });

  it('receives an error argument when the server fails', function (done) {
    connected(server, 80, function connect(err) {
      assume(err).to.be.instanceOf(Error);
      assume(this).to.equal(server);

      done();
    });
  });

  it('correctly listens to the supplied port arguments', function (done) {
    connected(server, 1024, function connected(err) {
      assume(err).to.equal(undefined);
      assume(this.address().port).to.equal(1024);
      assume(this).to.equal(server);

      done();
    });
  });

  it('allows the callback to be optional', function (done) {
    connected(server, 1024);

    server.once('listening', function connected(err) {
      assume(this.address().port).to.equal(1024);
      assume(this).to.equal(server);

      done();
    });
  });
});
