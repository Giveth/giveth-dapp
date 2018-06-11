exports.toBase26 = function(num) {
  var outString = '';
  var letters = 'abcdefghijklmnopqrstuvwxyz';
  while (num > 25) {
    var remainder = num % 26;
    outString = letters.charAt(remainder) + outString;
    num = Math.floor(num / 26) - 1;
  }
  outString = letters.charAt(num) + outString;
  return outString;
};

exports.makeFakeArgs = function(len) {
  var argArr = [];
  for (var i = 0; i < len; i++) {
    argArr.push(exports.toBase26(i));
  }
  return argArr.join(",");
};

exports.addArgs = function(fnString, argLen) {
  return fnString.replace(/function\s*\(\)/, 'function(' + exports.makeFakeArgs(argLen) + ')');
};

exports.emitEvents = function(emitter, type, name, args) {
  var ucName = name ? name.replace(/^\w/, function(first) {
    return first.toUpperCase();
  }) : null;

  emitter.emit.apply(emitter, [type].concat(args));
  if (ucName) {
    emitter.emit.apply(emitter, [type + ucName].concat(args));
  }
};
