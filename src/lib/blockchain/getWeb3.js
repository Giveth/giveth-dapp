import { MiniMeToken } from 'minimetoken';
import Web3 from 'web3';
import ZeroClientProvider from './ZeroClientProvider';
import config from '../../configuration';

import ErrorPopup from '../../components/ErrorPopup';

let givethWeb3;
let homeWeb3;
/* ///////////// custom Web3 Functions ///////////// */

const providerOpts = rpcUrl => {
  const opts = { rpcUrl };

  // TODO: this doesn't appear to work
  // if rpcUrl is a Websocket url, set blockTrackerProvider
  // so EthBlockTracker will use subscriptions for new blocks instead of polling
  // if (rpcUrl && /^ws(s)?:\/\//i.test(rpcUrl)) {
  // const p = new Web3.providers.WebsocketProvider(rpcUrl);
  // p.sendAsync = p.send;
  // opts.engineParams = { blockTrackerProvider: p };
  // }

  return opts;
};

const setWallet = (rpcUrl, isHomeNetwork = false) =>
  function set(wallet) {
    if (!wallet) throw new Error('a wallet is required');

    const web3 = this;

    const engine = new ZeroClientProvider(
      Object.assign(providerOpts(rpcUrl), {
        getAccounts: cb => cb(null, wallet.getAddresses()),
        approveTransaction: (txParams, cb) => {
          // TODO: handle locked wallet here?
          cb(null, true);
        },
        signTransaction: (txData, cb) => {
          // provide chainId as GivethWallet.Account does not have a provider set. If we don't provide
          // a chainId, the account will attempt to fetch it via the provider.
          const getId = txData.chainId ? Promise.resolve(txData.chainId) : this.eth.net.getId;

          // note: nonce & gasPrice are set by subproviders
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
      }),
    );

    const minimeTokenCache = {};

    const getBalance = () => {
      const { tokenAddresses } = config;
      const addr = wallet.getAddresses()[0];

      const tokenBal = tAddr => {
        if (!isHomeNetwork && tAddr) {
          const token = minimeTokenCache[tAddr] || new MiniMeToken(web3, tAddr);
          minimeTokenCache[tAddr] = token;
          return token.balanceOf(addr).then(bal => ({
            address: tAddr,
            bal,
          }));
        }
        return undefined;
      };
      const bal = () => (addr ? web3.eth.getBalance(addr) : undefined);

      Promise.all([bal(), ...Object.values(tokenAddresses).map(a => tokenBal(a))])
        .then(([balance, ...tokenBalances]) => {
          if (isHomeNetwork) wallet.homeBalance = balance;
          else {
            wallet.balance = balance;
            wallet.tokenBalances = tokenBalances.reduce((val, t) => {
              val[t.address] = t.bal;
              return val;
            }, {});
          }
        })
        .catch(err => {
          ErrorPopup(
            'Something went wrong with getting the balance. Please try again after refresh.',
            err,
          );
        });
    };

    getBalance();

    engine.on('block', getBalance);
    this.setProvider(engine);
  };

export const getWeb3 = () =>
  new Promise(resolve => {
    if (!givethWeb3) {
      givethWeb3 = new Web3(new ZeroClientProvider(providerOpts(config.foreignNodeConnection)));
      givethWeb3.setWallet = setWallet(config.foreignNodeConnection);
    }

    resolve(givethWeb3);
  });

export const getHomeWeb3 = () =>
  new Promise(resolve => {
    if (!homeWeb3) {
      homeWeb3 = new Web3(new ZeroClientProvider(providerOpts(config.homeNodeConnection)));
      homeWeb3.setWallet = setWallet(config.homeNodeConnection, true);
    }

    resolve(homeWeb3);
  });
