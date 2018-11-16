import React from 'react';
import { MiniMeToken } from 'minimetoken';
import Web3, { utils } from 'web3';
import ZeroClientProvider from './ZeroClientProvider';
import config from '../../configuration';
import { takeActionAfterWalletUnlock, confirmBlockchainTransaction } from '../middleware';
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
          // TODO consolidate wallet unlock & tx confirmation if wallet is lock
          // 2 popups are currently annoying

          // TODO may need to call cb(null, false) if the user doesn't unlock their wallet
          takeActionAfterWalletUnlock(wallet, () => {
            // if we return false, the promise is rejected.
            // confirmBlockchainTransaction(() => cb(null, true), () => cb(null, false));
            confirmBlockchainTransaction(() => cb(null, true), () => {});
          });
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

    engine.setMaxListeners(50);
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
    if (document.readyState !== 'complete') {
      // wait until complete
    }
    // only support inject web3 provider for home network
    if (!homeWeb3) {
      if (typeof window.web3 !== 'undefined') {
        homeWeb3 = new Web3(window.web3.currentProvider);
      } else {
        // we provide a fallback so we can generate/read data
        homeWeb3 = new Web3(config.homeNodeConnection);
      }
      // homeWeb3.setWallet = setWallet(config.homeNodeConnection, true);
      // TODO we can probably just remove this
      homeWeb3.setWallet = () => {};
    }

    resolve(homeWeb3);
  });

// The minimum ABI to handle any ERC20 Token balance, decimals and allowance approval
const miniABI = [
  // read balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  // read decimals
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  // set allowance approval
  {
    constant: false,
    inputs: [{ name: '_spender', type: 'address' }, { name: '_amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  // read allowance of a specific address
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
];

/**
  Fetches the balance of a specific address for any ERC20 token

  @param tokenContractAddress Address of the ERC20 token
  @param accountAddress  Address of the token holder, by default the current logged in user
* */
export const getERC20TokenBalance = (tokenContractAddress, accountAddress) =>
  new Promise((resolve, reject) =>
    getHomeWeb3().then(web3 => {
      const ERC20 = new web3.eth.Contract(miniABI, tokenContractAddress);

      ERC20.methods.balanceOf(accountAddress).call((error, balance) => {
        console.log(error, balance);
        if (balance) {
          ERC20.methods.decimals().call((e, decimals) => {
            if (decimals) resolve(utils.fromWei(balance));
            reject(e);
          });
        } else {
          reject(error);
        }
      });
    }),
  );

/**
  Functions to creates an allowance approval for an ERC20 token

  @param tokenContractAddress Address of the ERC20 token
  @param tokenHolderAddress  Address of the token holder, by default the current logged in user
  @param amount Amount in wei for the allowance. If none given defaults to unlimited (-1)
* */

const _createAllowance = (web3, etherScanUrl, ERC20, tokenHolderAddress, amount) =>
  new Promise((resolve, reject) =>
    ERC20.methods
      .approve(config.givethBridgeAddress, amount)
      .send({ from: tokenHolderAddress }, (err, txHash) => {
        if (amount === 0) {
          React.toast.info(
            <p>
              Please wait until your transaction is mined...<br />
              <strong>
                You will be asked to make another transaction to set the correct allowance!
              </strong>
              <br />
              <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        } else {
          React.toast.info(
            <p>
              Please wait until your transaction is mined...<br />
              <strong>You will be asked to make another transaction for your donation!</strong>
              <br />
              <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        }

        if (txHash) {
          web3.eth
            .getTransactionReceipt(txHash)
            .then(res => resolve(res))
            .catch(e => reject(e));
        } else {
          reject();
        }
      }),
  );

export const approveERC20tokenTransfer = (
  etherScanUrl,
  tokenContractAddress,
  tokenHolderAddress,
  amount = -1,
) =>
  new Promise((resolve, reject) =>
    getHomeWeb3().then(web3 => {
      const ERC20 = new web3.eth.Contract(miniABI, tokenContractAddress);

      // read existing allowance for the givethBridge
      ERC20.methods
        .allowance(tokenHolderAddress, config.givethBridgeAddress)
        .call((error, allowance) => {
          console.log(`Existing ERC20 allowance for address ${tokenHolderAddress}: `, allowance);
          // if no allowance, we set the allowance
          // if there's an existing allowance, but it's lower than the amount, we reset it and create a new allowance
          // in any other case, just continue

          /* eslint-disable eqeqeq */
          if (allowance == 0) {
            React.swal({
              title: 'Here we go...',
              content: React.swal.msg(
                <div>
                  <p>For your donation you need to make 2 transactions:</p>
                  <ol style={{ textAlign: 'left' }}>
                    <li>
                      A transaction to allow our contracts to transfer {utils.fromWei(amount)}{' '}
                      tokens.
                    </li>
                    <li>A transaction of 0 ETH to donate the tokens.</li>
                  </ol>
                </div>,
              ),
              icon: 'info',
              buttons: ['Cancel', 'Lets do it!'],
            })
              .then(isConfirmed => {
                if (isConfirmed) {
                  return _createAllowance(web3, etherScanUrl, ERC20, tokenHolderAddress, amount);
                }
                throw new Error('cancelled');
              })
              .then(() => resolve('approved'))
              .catch(err => reject(err));
          } else if (amount > allowance) {
            React.swal({
              title: 'Here we go...',
              content: React.swal.msg(
                <div>
                  <p>For your donation you need to make 3 transactions:</p>
                  <ol style={{ textAlign: 'left' }}>
                    <li>A transaction to reset your token allowance</li>
                    <li>
                      A transaction to allow our contracts to transfer {utils.fromWei(amount)}{' '}
                      tokens
                    </li>
                    <li>A transaction of 0 ETH to donate the tokens</li>
                  </ol>
                </div>,
              ),
              icon: 'info',
              buttons: ['Cancel', 'Lets do it!'],
            })
              .then(isConfirmed => {
                if (isConfirmed) {
                  return _createAllowance(web3, etherScanUrl, ERC20, tokenHolderAddress, 0);
                }
                throw new Error('cancelled');
              })
              .then(() => _createAllowance(web3, etherScanUrl, ERC20, tokenHolderAddress, amount))
              .then(() => resolve('approved'))
              .catch(err => reject(err));
          } else {
            resolve('approved');
          }
        });
    }),
  );
