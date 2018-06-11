'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LiquidPledgingState = function () {
  function LiquidPledgingState(liquidPledging) {
    _classCallCheck(this, LiquidPledgingState);

    this.$lp = liquidPledging;
  }

  _createClass(LiquidPledgingState, [{
    key: '$getPledge',
    value: function $getPledge(idPledge) {
      var _this = this;

      var pledge = {
        delegates: []
      };

      return this.$lp.getPledge(idPledge).then(function (res) {
        pledge.amount = res.amount;
        pledge.owner = res.owner;
        pledge.token = res.token;

        if (res.intendedProject) {
          pledge.intendedProject = res.intendedProject;
          pledge.commmitTime = res.commitTime;
        }
        if (res.oldPledge) {
          pledge.oldPledge = res.oldPledge;
        }
        if (res.pledgeState === '0') {
          pledge.pledgeState = 'Pledged';
        } else if (res.pledgeState === '1') {
          pledge.pledgeState = 'Paying';
        } else if (res.pledgeState === '2') {
          pledge.pledgeState = 'Paid';
        } else {
          pledge.pledgeState = 'Unknown';
        }

        var promises = [];
        for (var i = 1; i <= res.nDelegates; i += 1) {
          promises.push(_this.$lp.getPledgeDelegate(idPledge, i).then(function (r) {
            return {
              id: r.idDelegate,
              addr: r.addr,
              name: r.name,
              url: r.url
            };
          }));
        }

        return Promise.all(promises);
      }).then(function (delegates) {
        pledge.delegates = delegates;
        return pledge;
      });
    }
  }, {
    key: '$getAdmin',
    value: function $getAdmin(idAdmin) {
      var admin = {};
      return this.$lp.getPledgeAdmin(idAdmin).then(function (res) {
        if (res.adminType === '0') {
          admin.type = 'Giver';
        } else if (res.adminType === '1') {
          admin.type = 'Delegate';
        } else if (res.adminType === '2') {
          admin.type = 'Project';
        } else {
          admin.type = 'Unknown';
        }
        admin.addr = res.addr;
        admin.name = res.name;
        admin.url = res.url;
        admin.commitTime = res.commitTime;
        if (admin.type === 'Project') {
          admin.parentProject = res.parentProject;
          admin.canceled = res.canceled;
        }
        admin.plugin = res.plugin;
        return admin;
      });
    }
  }, {
    key: 'getState',
    value: function getState() {
      var _this2 = this;

      var getPledges = function getPledges() {
        return _this2.$lp.numberOfPledges().then(function (nPledges) {
          var promises = [];
          for (var i = 1; i <= nPledges; i += 1) {
            promises.push(_this2.$getPledge(i));
          }
          return Promise.all(promises);
        });
      };

      var getAdmins = function getAdmins() {
        return _this2.$lp.numberOfPledgeAdmins().then(function (nAdmins) {
          var promises = [];
          for (var i = 1; i <= nAdmins; i += 1) {
            promises.push(_this2.$getAdmin(i));
          }

          return Promise.all(promises);
        });
      };

      return Promise.all([getPledges(), getAdmins()]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            pledges = _ref2[0],
            admins = _ref2[1];

        return {
          pledges: [null].concat(_toConsumableArray(pledges)),
          admins: [null].concat(_toConsumableArray(admins))
        };
      });
    }
  }]);

  return LiquidPledgingState;
}();

module.exports = LiquidPledgingState;