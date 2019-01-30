import LPPCappedMilestone from './LPPCappedMilestone';
import BridgedMilestone from './BridgedMilestone';

/**
 * milestone Factory
 */
export default {
  create: data => {
    if (data.type === 'LPPCappedMilestone') return new LPPCappedMilestone(data);
    // if (data.type === 'LPMilestone') return new LPMilestone(data);
    return new BridgedMilestone(Object.assign({}, data, { type: 'BridgedMilestone' }));
  },
};
