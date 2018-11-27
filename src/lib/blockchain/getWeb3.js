import Web3 from 'web3';
import config from '../../configuration';

let newWeb3;

let enablePromise;
function enable(force = false) {
  if (!force && enablePromise) return enablePromise;

  enablePromise = new Promise((resolve, reject) =>
    this.currentProvider
      .enable()
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
      if (window.ethereum) {
        newWeb3 = new Web3(window.ethereum);
        newWeb3.enable = enable.bind(newWeb3);
        // newWeb3.accountsEnabled = false;
      } else if (window.web3) {
        newWeb3 = new Web3(window.web3.currentProvider);
        newWeb3.enable = newWeb3.eth.getAccounts;
        newWeb3.accountsEnabled = true;
      } else {
        // we provide a fallback so we can generate/read data
        newWeb3 = new Web3(config.foreignNodeConnection);
        newWeb3.defaultNode = true;
      }
    }

    resolve(newWeb3);
  });
