import LPPDac from 'lpp-dac';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import { feathersClient } from '../lib/feathersClient';
import { displayTransactionError } from '../lib/helpers';

class DACservice {
  static save(dac, onCreated = () => {}, onMined = () => {}) {
    if (dac.id) { // Just update existing DAC in feathers
      feathersClient.service('dacs').patch(dac.id, dac.toFeathers())
        .then(() => onMined());
    } else {
      let txHash;
      getNetwork()
        .then((network) => {
          getWeb3()
            .then((web3) => {
              const { liquidPledging } = network;

              LPPDac
                .new(web3, liquidPledging.$address, dac.title, '', 0, dac.tokenName, dac.tokenSymbol)
                // Transaction created
                .once('transactionHash', (hash) => {
                  txHash = hash;
                  dac.txHash = txHash;
                  console.log(dac.toFeathers());
                  feathersClient.service('dacs').create(dac.toFeathers())
                    .then(() => { onCreated(txHash); });
                })
                // Transaction mined
                .then(() => { onMined(`${network.etherscan}tx/${txHash}`); });
            })
            .catch((err) => {
              console.log('New DAC transaction failed:', err); // eslint-disable-line no-console
              displayTransactionError(txHash, network.etherscan);
            });
        }).catch(console.error); // TODO: Inform user that we are unable to connect to the network.
    }
  }
}

export default DACservice;
