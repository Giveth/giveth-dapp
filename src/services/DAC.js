import LPPDac from 'lpp-dac';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import { feathersClient } from '../lib/feathersClient';
import { displayTransactionError } from '../lib/helpers';

class DACservice {
  static save(dac, afterCreate = () => {}, afterMined = () => {}) {
    if (dac.id) {
      feathersClient.service('dacs').patch(dac.id, dac.toFeathers())
        .then(() => afterMined());
    } else {
      let txHash;
      let etherScanUrl;
      Promise.all([getNetwork(), getWeb3()])
        .then(([network, web3]) => {
          const { liquidPledging } = network;
          etherScanUrl = network.etherscan;

          LPPDac.new(web3, liquidPledging.$address, dac.title, '', 0, dac.tokenName, dac.tokenSymbol)
            .once('transactionHash', (hash) => {
              txHash = hash;
              dac.txHash = txHash;
              feathersClient.service('dacs').create(dac.toFeathers())
                .then(() => afterCreate(`${etherScanUrl}tx/${txHash}`));
            })
            .then(() => {
              afterMined(`${etherScanUrl}tx/${txHash}`);
            });
        })
        .catch((err) => {
          console.log('New DAC transaction failed:', err); // eslint-disable-line no-console
          displayTransactionError(txHash, etherScanUrl);
        });
    }
  }
}

export default DACservice;
