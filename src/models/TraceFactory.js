import LPPCappedTrace from './LPPCappedTrace';
import BridgedTrace from './BridgedTrace';
import LPTrace from './LPTrace';

/**
 * trace Factory
 */
export default {
  create: data => {
    if (data.type === 'LPPCappedMilestone') return new LPPCappedTrace(data);
    if (data.type === 'LPMilestone') return new LPTrace(data);
    return new BridgedTrace({ ...data });
  },
};
