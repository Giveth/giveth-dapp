import Web3 from 'web3';
import ZeroClientProvider from "./ZeroClientProvider";

let givethWeb3 = undefined;

export default () => {
  return new Promise((resolve) => {

    if (!givethWeb3) {
      givethWeb3 = new Web3(process.env.ETH_NODE_CONNECTION_URL);
    }

    // web3 1.0 expects the chainId to be no longer then 1 byte. If the chainId is longer then 1 byte,
    // an error will be thrown. Testrpc by default uses the timestamp for the networkId, thus causing
    // an error to be thrown. Here we override getId if necessary
    givethWeb3.eth.net.getId()
      .then(id => {
        if (id > 255) {
          console.warn(`Web3 will throw errors when signing transactions if the networkId > 255 (1 byte).
          networkID = ${id}. Overriding eth.net.getId() to return 255`);

          givethWeb3.eth.net.getId = () => Promise.resolve(255);
        }
      });

    givethWeb3.setWallet = setWallet;
    resolve(givethWeb3);
  })
}

/* ///////////// custom Web3 Functions ///////////// */

function setWallet(wallet) {
  if (!wallet) throw new Error('a wallet is required');

  const engine = new ZeroClientProvider({
    rpcUrl: this.currentProvider.host,
    getAccounts: cb => cb(null, wallet.getAddresses()),
    approveTransaction: (txParams, cb) => {
      console.log('approveTransaction', txParams);
      cb(null, true);
    },
    signTransaction: (txData, cb) => {
      console.log('signTransaction', txData);

      // provide chainId as GivethWallet.Account does not have a provider set. If we don't provide
      // a chainId, the account will attempt to fetch it via the provider.
      const getId = (txData.chainId) ? Promise.resolve(txData.chainId) : this.eth.net.getId;

      getId()
        .then(id => {
          txData.chainId = id;

          const sig = wallet.signTransaction(txData);
          cb(null, sig.rawTransaction);
        })
    },
  });

  this.setProvider(engine);
}