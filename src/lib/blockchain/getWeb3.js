import Web3 from 'web3';
import ZeroClientProvider from "./ZeroClientProvider";

let givethWeb3 = undefined;

const getWeb3 = () => {
  return new Promise((resolve) => {

    if (!givethWeb3) {
      givethWeb3 = new Web3(process.env.REACT_APP_ETH_NODE_CONNECTION_URL);

      // web3 1.0 expects the chainId to be no longer then 1 byte. If the chainId is longer then 1 byte,
      // an error will be thrown. Testrpc by default uses the timestamp for the networkId, thus causing
      // an error to be thrown. Here we override getId if necessary
      // Since web3-eth-account account.js uses the following formula when signing a tx (Nat.toNumber(tx.chainId || "0x1") * 2 + 35),
      // and that number is added to the signature.recoveryParam the max value the network ID can be is 110 (110 * 2 + 35 === 255) - recoveryParam
      givethWeb3.eth.net.getId()
        .then(id => {
          if (id > 110) {
            console.warn(`Web3 will throw errors when signing transactions if the networkId > 255 (1 byte).
          networkID = ${id}. Overriding eth.net.getId() to return 100`);

            givethWeb3.eth.net.getId = () => Promise.resolve(100);
          }
        });

      givethWeb3.setWallet = setWallet;
    }

    resolve(givethWeb3);
  })
}

export default getWeb3;

/* ///////////// custom Web3 Functions ///////////// */

function setWallet(wallet) {
  if (!wallet) throw new Error('a wallet is required');

  const engine = new ZeroClientProvider({
    wsProvider: this.currentProvider,
    getAccounts: cb => cb(null, wallet.getAddresses()),
    approveTransaction: (txParams, cb) => {
      //TODO handle locked wallet here?
      cb(null, true);
    },
    signTransaction: (txData, cb) => {
      // provide chainId as GivethWallet.Account does not have a provider set. If we don't provide
      // a chainId, the account will attempt to fetch it via the provider.
      const getId = (txData.chainId) ? Promise.resolve(txData.chainId) : this.eth.net.getId;

      getId()
        .then(id => {
          txData.chainId = id;

          try {
            const sig = wallet.signTransaction(txData);
            cb(null, sig.rawTransaction);
          } catch (err) {
            cb(err);
          }

        })
    },
  });

  const getBalance = () => getWeb3()
    .then(web3 => {
      const addr = wallet.getAddresses()[ 0 ];

      return (addr) ? web3.eth.getBalance(addr) : undefined;
    })
    .then(balance => wallet.balance = balance)
    .catch(console.error);

  getBalance();

  engine.on('block', getBalance);

  this.setProvider(engine);
}