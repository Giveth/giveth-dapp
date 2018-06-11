'use strict';

var ethjsUtil = require('ethjs-util');

module.exports = {
  incrementHexNumber: incrementHexNumber,
  formatHex: formatHex
};

function incrementHexNumber(hexNum) {
  return formatHex(ethjsUtil.intToHex(parseInt(hexNum, 16) + 1));
}

function formatHex(hexNum) {
  var stripped = ethjsUtil.stripHexPrefix(hexNum);
  while (stripped[0] === '0') {
    stripped = stripped.substr(1);
  }
  return '0x' + stripped;
}