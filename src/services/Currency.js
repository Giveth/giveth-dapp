import { feathersClient } from '../lib/feathersClient';
import { resolve } from 'dns';

class Currency {
  fiatTypes = ['BRL', 'CAD', 'CHF', 'CZK', 'EUR', 'GBP', 'MXN', 'THB', 'USD'];

  /**
   * Get fiat type
   * @param id
   */

  getFiatType(id) {
    for (var x = 0; x < this.fiatTypes.length; x++) {
      if (id == this.fiatTypes[x]) {
        return this.fiatTypes[x];
      }
    }
  }
}
export default Currency;
