'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verify = exports.Service = undefined;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var findAllData = [{
  id: 0,
  description: 'You have to do something'
}, {
  id: 1,
  description: 'You have to do laundry'
}];

var Service = exports.Service = {
  events: ['log'],

  find: function find() {
    return Promise.resolve(findAllData);
  },
  get: function get(name, params) {
    if (params.query.error) {
      return Promise.reject(new Error('Something for ' + name + ' went wrong'));
    }

    if (params.query.runtimeError) {
      thingThatDoesNotExist(); // eslint-disable-line
    }

    return Promise.resolve({
      id: name,
      description: 'You have to do ' + name + '!'
    });
  },
  create: function create(data) {
    var result = _extends({}, data, {
      id: 42,
      status: 'created'
    });

    if (Array.isArray(data)) {
      result.many = true;
    }

    return Promise.resolve(result);
  },
  update: function update(id, data) {
    var result = _extends({}, data, {
      id: id, status: 'updated'
    });

    if (id === null) {
      result.many = true;
    }

    return Promise.resolve(result);
  },
  patch: function patch(id, data) {
    var result = _extends({}, data, {
      id: id, status: 'patched'
    });

    if (id === null) {
      result.many = true;
    }

    return Promise.resolve(result);
  },
  remove: function remove(id) {
    return Promise.resolve({ id: id });
  }
};

var verify = exports.verify = {
  find: function find(data) {
    _assert2.default.deepEqual(findAllData, data, 'Data as expected');
  },
  get: function get(id, data) {
    _assert2.default.equal(data.id, id, 'Got id in data');
    _assert2.default.equal(data.description, 'You have to do ' + id + '!', 'Got description');
  },
  create: function create(original, current) {
    var expected = _extends({}, original, {
      id: 42,
      status: 'created'
    });
    _assert2.default.deepEqual(expected, current, 'Data ran through .create as expected');
  },
  update: function update(id, original, current) {
    var expected = _extends({}, original, {
      id: id,
      status: 'updated'
    });
    _assert2.default.deepEqual(expected, current, 'Data ran through .update as expected');
  },
  patch: function patch(id, original, current) {
    var expected = _extends({}, original, {
      id: id,
      status: 'patched'
    });
    _assert2.default.deepEqual(expected, current, 'Data ran through .patch as expected');
  },
  remove: function remove(id, data) {
    _assert2.default.deepEqual({ id: id }, data, '.remove called');
  }
};