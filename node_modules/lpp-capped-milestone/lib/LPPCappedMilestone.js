'use strict';

var LPPCappedMilestoneAbi = require('../build/LPPCappedMilestone.sol').LPPCappedMilestoneAbi;
var LPPCappedMilestoneByteCode = require('../build/LPPCappedMilestone.sol').LPPCappedMilestoneByteCode;
var generateClass = require('eth-contract-class').default;

var LPPCappedMilestone = generateClass(LPPCappedMilestoneAbi, LPPCappedMilestoneByteCode);

module.exports = LPPCappedMilestone;
//# sourceMappingURL=LPPCappedMilestone.js.map