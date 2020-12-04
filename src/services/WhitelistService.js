import { feathersClient } from '../lib/feathersClient';

const whitelists = feathersClient.service('whitelist');

class WhitelistService {
  /**
   * Get whitelist values
   * @returns {*}
   */
  static getWhitelists() {
    return whitelists.find();
  }
}

export default WhitelistService;
