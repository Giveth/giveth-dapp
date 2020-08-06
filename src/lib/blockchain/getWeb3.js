import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import config from '../../configuration';

let newWeb3;

let enablePromise;
function enable(force = false) {
  if (!force && enablePromise) return enablePromise;

  enablePromise = new Promise((resolve, reject) =>
    this.currentProvider
      .request({ method: 'eth_requestAccounts' })
      .then(addrs => {
        this.isEnabled = true;
        resolve(addrs);
      })
      .catch(e => {
        enablePromise = false;
        this.isEnabled = false;
        reject(e);
      }),
  );

  return enablePromise;
}

export default () =>
  new Promise(resolve => {
    if (document.readyState !== 'complete') {
      // wait until complete
    }

    if (!newWeb3) {
      detectEthereumProvider().then(provider => {
        if (provider) {
          newWeb3 = new Web3(provider);
          newWeb3.enable = enable.bind(newWeb3);
          newWeb3.ethereum = window.ethereum;
          if (newWeb3.ethereum && newWeb3.ethereum.isMetaMask) {
            newWeb3.isMetaMask = true;
            newWeb3.ethereum.autoRefreshOnNetworkChange = false;
          }
        } else {
          // we provide a fallback so we can generate/read data
          newWeb3 = new Web3(config.foreignNodeConnection);
          newWeb3.defaultNode = true;
        }
        resolve(newWeb3);
      });
    } else {
      resolve(newWeb3);
    }
  });
