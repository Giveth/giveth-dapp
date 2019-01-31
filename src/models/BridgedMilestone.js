import { BridgedMilestone as BridgedMilestoneContract } from 'lpp-milestones';
import Milestone from './Milestone';

/**
 * The DApp BridgedMilestone model
 */
export default class BridgedMilestone extends Milestone {
  contract(web3) {
    if (!web3) throw new Error('web3 instance is required');
    return new BridgedMilestoneContract(web3, this.pluginAddress);
  }
}
