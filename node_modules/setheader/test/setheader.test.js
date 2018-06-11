describe('setHeader', function () {
  'use strict';

  var request = require('request')
    , setHeader = require('../')
    , http = require('http')
    , chai = require('chai')
    , expect = chai.expect
    , port = 9000;

  chai.Assertion.includeStack = true;

  it('is exported as function', function () {
    expect(setHeader).to.be.a('function');
  });

  it('prevents header from being overridden', function (done) {
    var server = http.createServer(function (req, res) {
      // control
      res.setHeader('Foo', 'bar');
      expect(res.getHeader('Foo')).to.equal('bar');

      // set
      setHeader(res, 'Foo', 'baz');
      expect(res.getHeader('Foo')).to.equal('baz');

      // ensure no change
      res.setHeader('Foo', 'bar');
      expect(res.getHeader('Foo')).to.equal('baz');

      // set
      setHeader(res, 'Foo', 'bazz');
      expect(res.getHeader('Foo')).to.equal('baz');

      res.end('foo');
    }), connect = ++port;

    server.listen(connect, function () {
      request('http://localhost:'+ connect, function (err, res) {
        server.close();

        if (err) return done(err);

        expect(res.headers.foo).to.equal('baz');
        done();
      });
    });
  });
});
