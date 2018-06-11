'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (app, name) {
  var getService = function getService() {
    return name && typeof app.service === 'function' ? app.service(name) : app;
  };

  describe('Service base tests', function () {
    it('.find', function (done) {
      getService().find().then(function (todos) {
        return _assert2.default.deepEqual(todos, [{
          text: 'some todo',
          complete: false,
          id: 0
        }]);
      }).then(function () {
        return done();
      }).catch(done);
    });

    it('.get and params passing', function (done) {
      var query = {
        some: 'thing',
        other: ['one', 'two'],
        nested: { a: { b: 'object' } }
      };

      getService().get(0, { query: query }).then(function (todo) {
        return _assert2.default.deepEqual(todo, {
          id: 0,
          text: 'some todo',
          complete: false,
          query: query
        });
      }).then(function () {
        return done();
      }).catch(done);
    });

    it('.create and created event', function (done) {
      getService().once('created', function (data) {
        _assert2.default.equal(data.text, 'created todo');
        _assert2.default.ok(data.complete);
        done();
      });

      getService().create({ text: 'created todo', complete: true });
    });

    it('.update and updated event', function (done) {
      getService().once('updated', function (data) {
        _assert2.default.equal(data.text, 'updated todo');
        _assert2.default.ok(data.complete);
        done();
      });

      getService().create({ text: 'todo to update', complete: false }).then(function (todo) {
        return getService().update(todo.id, {
          text: 'updated todo',
          complete: true
        });
      });
    });

    it('.patch and patched event', function (done) {
      getService().once('patched', function (data) {
        _assert2.default.equal(data.text, 'todo to patch');
        _assert2.default.ok(data.complete);
        done();
      });

      getService().create({ text: 'todo to patch', complete: false }).then(function (todo) {
        return getService().patch(todo.id, { complete: true });
      });
    });

    it('.remove and removed event', function (done) {
      getService().once('removed', function (data) {
        _assert2.default.equal(data.text, 'todo to remove');
        _assert2.default.equal(data.complete, false);
        done();
      });

      getService().create({ text: 'todo to remove', complete: false }).then(function (todo) {
        return getService().remove(todo.id);
      }).catch(done);
    });

    it('.get with error', function (done) {
      var query = { error: true };
      getService().get(0, { query: query }).then(done, function (error) {
        _assert2.default.ok(error && error.message);
        done();
      });
    });
  });
};

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];