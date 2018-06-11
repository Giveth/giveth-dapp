'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stripSlashes = stripSlashes;
exports.each = each;
exports.some = some;
exports.every = every;
exports.keys = keys;
exports.values = values;
exports.isMatch = isMatch;
exports.isEmpty = isEmpty;
exports.isObject = isObject;
exports.extend = extend;
exports.omit = omit;
exports.pick = pick;
exports.merge = merge;
exports.select = select;
exports.matcher = matcher;
exports.sorter = sorter;
exports.makeUrl = makeUrl;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function stripSlashes(name) {
  return name.replace(/^(\/*)|(\/*)$/g, '');
}

function each(obj, callback) {
  if (obj && typeof obj.forEach === 'function') {
    obj.forEach(callback);
  } else if (isObject(obj)) {
    Object.keys(obj).forEach(function (key) {
      return callback(obj[key], key);
    });
  }
}

function some(value, callback) {
  return Object.keys(value).map(function (key) {
    return [value[key], key];
  }).some(function (current) {
    return callback.apply(undefined, _toConsumableArray(current));
  });
}

function every(value, callback) {
  return Object.keys(value).map(function (key) {
    return [value[key], key];
  }).every(function (current) {
    return callback.apply(undefined, _toConsumableArray(current));
  });
}

function keys(obj) {
  return Object.keys(obj);
}

function values(obj) {
  return _.keys(obj).map(function (key) {
    return obj[key];
  });
}

function isMatch(obj, item) {
  return _.keys(item).every(function (key) {
    return obj[key] === item[key];
  });
}

function isEmpty(obj) {
  return _.keys(obj).length === 0;
}

function isObject(item) {
  return (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object' && !Array.isArray(item) && item !== null;
}

function extend() {
  return _extends.apply(undefined, arguments);
}

function omit(obj) {
  var result = _.extend({}, obj);

  for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }

  keys.forEach(function (key) {
    return delete result[key];
  });
  return result;
}

function pick(source) {
  var result = {};

  for (var _len2 = arguments.length, keys = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    keys[_key2 - 1] = arguments[_key2];
  }

  keys.forEach(function (key) {
    result[key] = source[key];
  });
  return result;
}

function merge(target, source) {
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(function (key) {
      if (isObject(source[key])) {
        if (!target[key]) _extends(target, _defineProperty({}, key, {}));
        merge(target[key], source[key]);
      } else {
        _extends(target, _defineProperty({}, key, source[key]));
      }
    });
  }
  return target;
}

var _ = exports._ = {
  each: each,
  some: some,
  every: every,
  keys: keys,
  values: values,
  isMatch: isMatch,
  isEmpty: isEmpty,
  isObject: isObject,
  extend: extend,
  omit: omit,
  pick: pick,
  merge: merge
};

var specialFilters = exports.specialFilters = {
  $in: function $in(key, ins) {
    return function (current) {
      return ins.indexOf(current[key]) !== -1;
    };
  },
  $nin: function $nin(key, nins) {
    return function (current) {
      return nins.indexOf(current[key]) === -1;
    };
  },
  $lt: function $lt(key, value) {
    return function (current) {
      return current[key] < value;
    };
  },
  $lte: function $lte(key, value) {
    return function (current) {
      return current[key] <= value;
    };
  },
  $gt: function $gt(key, value) {
    return function (current) {
      return current[key] > value;
    };
  },
  $gte: function $gte(key, value) {
    return function (current) {
      return current[key] >= value;
    };
  },
  $ne: function $ne(key, value) {
    return function (current) {
      return current[key] !== value;
    };
  }
};

function select(params) {
  var fields = params && params.query && params.query.$select;

  for (var _len3 = arguments.length, otherFields = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    otherFields[_key3 - 1] = arguments[_key3];
  }

  if (Array.isArray(fields) && otherFields.length) {
    fields.push.apply(fields, otherFields);
  }

  var convert = function convert(result) {
    if (!Array.isArray(fields)) {
      return result;
    }

    return _.pick.apply(_, [result].concat(_toConsumableArray(fields)));
  };

  return function (result) {
    if (Array.isArray(result)) {
      return result.map(convert);
    }

    return convert(result);
  };
}

function matcher(originalQuery) {
  var query = _.omit(originalQuery, '$limit', '$skip', '$sort', '$select');

  return function (item) {
    if (query.$or && _.some(query.$or, function (or) {
      return matcher(or)(item);
    })) {
      return true;
    }

    return _.every(query, function (value, key) {
      if (value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
        return _.every(value, function (target, filterType) {
          if (specialFilters[filterType]) {
            var filter = specialFilters[filterType](key, target);
            return filter(item);
          }

          return false;
        });
      } else if (typeof item[key] !== 'undefined') {
        return item[key] === query[key];
      }

      return false;
    });
  };
}

function sorter($sort) {
  return function (first, second) {
    var comparator = 0;
    each($sort, function (modifier, key) {
      modifier = parseInt(modifier, 10);

      if (first[key] < second[key]) {
        comparator -= 1 * modifier;
      }

      if (first[key] > second[key]) {
        comparator += 1 * modifier;
      }
    });
    return comparator;
  };
}

function makeUrl(path) {
  var app = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var get = typeof app.get === 'function' ? app.get.bind(app) : function () {};
  var env = get('env') || process.env.NODE_ENV;
  var host = get('host') || process.env.HOST_NAME || 'localhost';
  var protocol = env === 'development' || env === 'test' || env === undefined ? 'http' : 'https';
  var PORT = get('port') || process.env.PORT || 3030;
  var port = env === 'development' || env === 'test' || env === undefined ? ':' + PORT : '';

  path = path || '';

  return protocol + '://' + host + port + '/' + stripSlashes(path);
}