import LPPCappedTrace from './LPPCappedTrace';
import BridgedTrace from './BridgedTrace';
import LPTrace from './LPTrace';

/**
 * trace Factory
 */
export default {
  create: data => {
    if (data.type === 'LPPCappedTrace') return new LPPCappedTrace(data);
    if (data.type === 'LPTrace') return new LPTrace(data);
    return new BridgedTrace({ ...data });
  },
};
