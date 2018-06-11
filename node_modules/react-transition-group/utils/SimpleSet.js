"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SimpleSet = function () {
  function SimpleSet() {
    _classCallCheck(this, SimpleSet);

    this.v = [];
  }

  SimpleSet.prototype.clear = function clear() {
    this.v.length = 0;
  };

  SimpleSet.prototype.has = function has(k) {
    return this.v.indexOf(k) !== -1;
  };

  SimpleSet.prototype.add = function add(k) {
    if (this.has(k)) return;
    this.v.push(k);
  };

  SimpleSet.prototype.delete = function _delete(k) {
    var idx = this.v.indexOf(k);
    if (idx === -1) return false;
    this.v.splice(idx, 1);
    return true;
  };

  return SimpleSet;
}();

exports.default = SimpleSet;
module.exports = exports["default"];