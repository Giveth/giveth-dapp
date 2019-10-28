import Web3 from 'web3';

import config from '../../configuration';
import portis from '../portisSingleton';

let web3Instance;
let enablePromise;
let isPortisLoggedIn = false;

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

const createNewWeb3 = ({
  provider,
  providerName,
  getEnableFunc = () => null,
  getIsApprovedMethod = () => null,
  isDefaultNode = false,
}) => {
  const newWeb3 = new Web3(provider);

  newWeb3.enable = getEnableFunc(newWeb3);
  newWeb3.isApprovedMethod = getIsApprovedMethod(newWeb3);
  newWeb3.providerName = providerName;
  newWeb3.isDefaultNode = isDefaultNode;

  return newWeb3;
};

export const WEB3_PROVIDER_NAMES = { portis: 'PORTIS', metaMask: 'METAMASK' };

export default () =>
  new Promise(resolve => {
    if (document.readyState !== 'complete') {
      // wait until complete
    }

    portis.isLoggedIn().then(({ result }) => {
      if (web3Instance && result === isPortisLoggedIn) {
        resolve(web3Instance);
      } else {
        isPortisLoggedIn = result;
        if (isPortisLoggedIn) {
          web3Instance = createNewWeb3({
            getEnableFunc: newWeb3 => enable.bind(newWeb3),
            getIsApprovedMethod: () => async () => !!(await web3Instance.eth.getAccounts()).length,
            provider: portis.provider,
            providerName: WEB3_PROVIDER_NAMES.portis,
          });
        } else if (window.ethereum) {
          web3Instance = createNewWeb3({
            getEnableFunc: newWeb3 => enable.bind(newWeb3),
            getIsApprovedMethod: newWeb3 => newWeb3.currentProvider._metamask.isApproved,
            provider: window.ethereum,
            providerName: WEB3_PROVIDER_NAMES.metaMask,
          });
        } else if (window.web3) {
          web3Instance = createNewWeb3({
            getEnableFunc: () => web3Instance.eth.getAccounts,
            getIsApprovedMethod: newWeb3 => newWeb3.currentProvider._metamask.isApproved,
            provider: window.web3.currentProvider,
            providerName: WEB3_PROVIDER_NAMES.metaMask,
          });
        } else {
          // we provide a fallback so we can generate/read data
          web3Instance = createNewWeb3({
            isDefaultNode: true,
            provider: config.foreignNodeConnection,
            providerName: config.foreignNetworkName,
          });
        }

        resolve(web3Instance);
      }
    });
  });
