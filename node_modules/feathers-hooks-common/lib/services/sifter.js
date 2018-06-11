'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (getSifter) {
    return function (hook) {
        (0, _checkContext2.default)(hook, 'after', 'find', 'sifter');

        if (typeof getSifter !== 'function') {
            throw new _feathersErrors2.default.BadRequest('The sifter param must be a function. (sifter)');
        }

        var sifter = getSifter(hook);

        if (typeof sifter !== 'function') {
            throw new _feathersErrors2.default.BadRequest('The result of calling the sifter param must be a function. (sifter)');
        }

        (0, _replaceItems2.default)(hook, (0, _getItems2.default)(hook).filter(sifter));

        return hook;
    };
};

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _checkContext = require('./check-context');

var _checkContext2 = _interopRequireDefault(_checkContext);

var _getItems = require('./get-items');

var _getItems2 = _interopRequireDefault(_getItems);

var _replaceItems = require('./replace-items');

var _replaceItems2 = _interopRequireDefault(_replaceItems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];

// import sift from 'sift';
// getSifter = hook => sift({ 'address.country': hook.params.country }