import { feathersClient } from '../lib/feathersClient';
import { resolve } from 'dns';

class Currency {
  fiatTypes = [
    { value: 'BRL', title: 'BRL' },
    { value: 'CAD', title: 'CAD' },
    { value: 'CHF', title: 'CHF' },
    { value: 'CZK', title: 'CZK' },
    { value: 'ETH', title: 'ETH' },
    { value: 'EUR', title: 'EUR' },
    { value: 'GBP', title: 'GBP' },
    { value: 'MXN', title: 'MXN' },
    { value: 'THB', title: 'THB' },
    { value: 'USD', title: 'USD' },
  ];
}
export default Currency;
