import { MiniMeToken } from 'minimetoken';
import Web3 from 'web3';
import ZeroClientProvider from './ZeroClientProvider';
import config from '../../configuration';

import ErrorPopup from '../../components/ErrorPopup';

let givethWeb3;
let homeWeb3;
/* ///////////// custom Web3 Functions ///////////// */

let intervalId;
function setWallet(wallet) {
  if (!wallet) throw new Error('a wallet is required');

  const engine = new ZeroClientProvider({
    wsProvider: this.currentProvider,
    getAccounts: cb => cb(null, wallet.getAddresses()),
    approveTransaction: (txParams, cb) => {
      // TODO: handle locked wallet here?
      cb(null, true);
    },
    signTransaction: (txData, cb) => {
      // provide chainId as GivethWallet.Account does not have a provider set. If we don't provide
      // a chainId, the account will attempt to fetch it via the provider.
      const getId = txData.chainId ? Promise.resolve(txData.chainId) : this.eth.net.getId;

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
    getWeb3() // eslint-disable-line no-use-before-define
      .then(web3 => {
        const { tokenAddresses } = config;
        const addr = wallet.getAddresses()[0];

        const tokenBal = tAddr =>
          tAddr
            ? new MiniMeToken(web3, tAddr).balanceOf(addr).then(bal => ({
                address: tAddr,
                bal,
              }))
            : undefined;
        const bal = () => (addr ? web3.eth.getBalance(addr) : undefined);

        return Promise.all([bal(), ...Object.values(tokenAddresses).map(a => tokenBal(a))]);
      })
      .then(([balance, ...tokenBalances]) => {
        wallet.balance = balance;
        wallet.tokenBalances = tokenBalances.reduce((val, t) => {
          val[t.address] = t.bal;
          return val;
        }, {});
      })
      .catch(err => {
        ErrorPopup(
          'Something went wrong with getting the balance. Please try again after refresh.',
          err,
        );
      });

  getBalance();
  // engine.on('block', getBalance); //TODO get this to work
  if (intervalId > 0) {
    clearInterval(intervalId);
  }
  // TODO: if removing this interval, need to uncomment the ws timeout fix below
  intervalId = setInterval(getBalance, 15000);
  this.setProvider(engine);
}

export const getWeb3 = () =>
  new Promise(resolve => {
    if (!givethWeb3) {
      givethWeb3 = new Web3(config.foreignNodeConnection);

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

export const getHomeWeb3 = () =>
  new Promise(resolve => {
    if (!homeWeb3) {
      homeWeb3 = new Web3(config.homeNodeConnection);

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
      homeWeb3.eth.net.getId().then(id => {
        if (id > 110) {
          const msg = `Web3 will throw errors when signing transactions if the networkId > 255 (1 byte).
          networkID = ${id}. Overriding eth.net.getId() to return 100`;

          console.warn(msg); // eslint-disable-line no-console

          homeWeb3.eth.net.getId = () => Promise.resolve(100);
        }
      });

      homeWeb3.setWallet = setWallet;
    }

    resolve(homeWeb3);
  });
