import { MiniMeToken } from 'minimetoken';
import Web3 from 'web3';
import ZeroClientProvider from './ZeroClientProvider';
import getNetwork from './getNetwork';
import config from '../../configuration';

let givethWeb3;
/* ///////////// custom Web3 Functions ///////////// */

let intervalId;
function setWallet(wallet) {
  if (!wallet) throw new Error('a wallet is required');

  const engine = new ZeroClientProvider({
    wsProvider: this.currentProvider,
    getAccounts: cb => cb(null, wallet.getAddresses()),
    approveTransaction: (txParams, cb) => {
      // TODO handle locked wallet here?
      cb(null, true);
    },
    signTransaction: (txData, cb) => {
      // provide chainId as GivethWallet.Account does not have a provider set. If we don't provide
      // a chainId, the account will attempt to fetch it via the provider.
      const getId = txData.chainId
        ? Promise.resolve(txData.chainId)
        : this.eth.net.getId;

      getId()
        .then(id => {
          txData.chainId = id;
          return wallet.signTransaction(txData);
        })
        .then(sig => {
          cb(null, sig.rawTransaction);
        })
        .catch(err => {
          cb(err);
        });
    },
  });

  const getBalance = () =>
    Promise.all([getWeb3(), getNetwork()]) // eslint-disable-line no-use-before-define
      .then(([web3, network]) => {
        const { tokenAddress } = network;
        const addr = wallet.getAddresses()[0];

        const tokenBal = () =>
          addr
            ? new MiniMeToken(web3, tokenAddress).balanceOf(addr)
            : undefined;
        const bal = () => (addr ? web3.eth.getBalance(addr) : undefined);

        return Promise.all([tokenBal(), bal()]);
      })
      .then(([tokenBalance, balance]) => {
        wallet.balance = balance;
        wallet.tokenBalance = tokenBalance;
      })
      .catch(console.error); // eslint-disable-line no-console

  getBalance();
  // engine.on('block', getBalance); //TODO get this to work
  if (intervalId > 0) {
    clearInterval(intervalId);
  }
  // TODO if removing this interval, need to uncomment the ws timeout fix below
  intervalId = setInterval(getBalance, 15000);
  this.setProvider(engine);
}

const getWeb3 = () =>
  new Promise(resolve => {
    if (!givethWeb3) {
      givethWeb3 = new Web3(config.nodeConnection);

      // hack to keep the ws connection from timing-out
      // I commented this out b/c we have the getBalance interval above
      // setInterval(() => {
      //   givethWeb3.eth.net.getId();
      // }, 30000); // every 30 seconds

      // web3 1.0 expects the chainId to be no longer then 1 byte. If the chainId is longer
      // then 1 byte, an error will be thrown. Testrpc by default uses the timestamp for the
      // networkId, thus causing an error to be thrown. Here we override getId if necessary
      // Since web3-eth-account account.js uses the following formula when signing a tx
      // (Nat.toNumber(tx.chainId || "0x1") * 2 + 35), and that number is added to the
      // signature.recoveryParam the max value the network ID can be is
      // 110 (110 * 2 + 35 === 255) - recoveryParam
      givethWeb3.eth.net.getId().then(id => {
        if (id > 110) {
          const msg = `Web3 will throw errors when signing transactions if the networkId > 255 (1 byte).
          networkID = ${id}. Overriding eth.net.getId() to return 100`;

          console.warn(msg); // eslint-disable-line no-console

          givethWeb3.eth.net.getId = () => Promise.resolve(100);
        }
      });

      givethWeb3.setWallet = setWallet;
    }

    resolve(givethWeb3);
  });

export default getWeb3;
