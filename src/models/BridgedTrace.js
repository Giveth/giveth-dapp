import { BridgedMilestone as BridgedMilestoneContract } from 'lpp-milestones';
import Trace from './Trace';

/**
 * The DApp BridgedTrace model
 */
export default class BridgedTrace extends Trace {
  contract(web3) {
    if (!web3) throw new Error('web3 instance is required');
    return new BridgedMilestoneContract(web3, this.pluginAddress);
  }

  // eslint-disable-next-line class-methods-use-this
  get traceType() {
    return 'BridgedMilestone';
  }
}
