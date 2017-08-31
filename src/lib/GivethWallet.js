import localforage from 'localforage';
import Accounts from 'web3-eth-accounts';

const STORAGE_KEY = 'keystore';

const _get = WeakMap.prototype.get;
const _set = WeakMap.prototype.set;

const _accounts = new WeakMap();
const _password = new WeakMap();

/**
 * Wallet to handle ethereum accounts. While this wallet can store multiple accounts, we currently sign using only
 * the first account.
 *
 * TODO: allow account specification for signing tx/messages
 */
class GivethWallet {

  /**
   *
   * @param provider      optional. This is necessary when signing a transaction to retrieve chainId, gasPrice
   *                      and nonce automatically
   * @param keystoreArray array of keystores to add to the wallet
   */
  constructor(provider, keystoreArray) {
    const accounts = new Accounts(provider);
    _set.call(_accounts, this, accounts);

    this._keystore = keystoreArray;

    this.unlocked = false;
  }

  /**
   * sign a message with the first account
   *
   * @param msg   the message to sign
   * @returns     object containing signature data. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
   */
  signMessage(msg) {
    if (!this.unlocked) throw new Error("Locked Wallet");

    const accounts = _get.call(_accounts, this);

    return accounts.wallet[ 0 ].sign(msg || "")
  }

  unlock(password) {
    return new Promise(resolve => {
      if (this.unlocked) return resolve(true);

      _set.call(_password, this, password);

      const decrypt = () => {
        const accounts = _get.call(_accounts, this);
        accounts.wallet.decrypt(this._keystore, password);

        this.unlocked = true;
        resolve(true);
      };

      // web3 blocks all rendering, so we need to request an animation frame
      window.requestAnimationFrame(decrypt)

    })
  }

  lock() {
    return new Promise(resolve => {
      if (!this.unlocked) return resolve();

      const accounts = _get.call(_accounts, this);
      this.getKeystore(ks => {
        this._keystore = ks;
      });

      accounts.wallet.clear();
      this.unlocked = false;
      resolve();
    });
  }

  /**
   * remove all accounts from this wallet
   */
  clear() {
    _get.call(_accounts, this).wallet.clear();
  }

  /**
   * returns an array of encrypted keystore objects. utilizes a callback to return the array so we don't block
   * the main thread as encrypting the keystores is cpu intensive.
   *
   * TODO: look into using webworkers for encrypting/decrypting keystores
   *
   * @param callback function that will recieve the array of keystores
   */
  getKeystore(callback) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('a callback function is required');
    }

    if (this.unlocked) {

      // This code is a bit spaghetti, but we need to use requestAnimationFrame multiple times here.
      // or the complete thread is blocked, causing rendering to stall.
      function fetchWallet() {
        const password = _get.call(_password, this);

        function getAccounts() {
          const accounts = _get.call(_accounts, this);
          callback(accounts.wallet.encrypt(password));
        }

        window.requestAnimationFrame(getAccounts.bind(this))
      }

      window.requestAnimationFrame(fetchWallet.bind(this))

    }

    callback(this._keystore);
  }

  /**
   * @return {Array} of addresses in this wallet
   */
  getAddresses() {
    if (this.unlocked) {
      const wallet = _get.call(_accounts, this).wallet;
      const addrs = [];

      for (let i = 0; i < wallet.length; i++) {
        addrs[ i ] = wallet[ i ].address;
      }

      return addrs;
    }

    if (!this._keystore) return [];

    return this._keystore.map(account => GivethWallet.fixAddress(account.address));
  }

  /**
   * locally caches the keystore in storage
   */
  cacheKeystore() {
    this.getKeystore((keystore) => {
      localforage.setItem('keystore', keystore)
    })

  }

  /**
   * normalize an address to the 0x form
   */
  static fixAddress(addr) {
    return (addr.toLowerCase().startsWith('0x')) ? addr : `0x${addr}`;
  }

  /**
   * generate a new wallet with a new keystore
   * @param provider - optional
   * @param password - password to encrypt the wallet with
   */
  static createWallet(provider, password) {
    return new Promise(resolve => {
      const createWallet = () => {
        const keystore = new Accounts(provider).wallet.create(1).encrypt(password);
        resolve(createGivethWallet(keystore, provider, password));
      };

      // web3 blocks all rendering, so we need to request an animation frame
      window.requestAnimationFrame(createWallet)
    });
  }

  /**
   * loads a GivethWallet with the provided keystores.
   *
   * @param keystore    the keystores to hold in the wallet
   * @param provider    optional. web3 provider
   * @param password    optional. if provided, the returned wallet will be unlocked, otherwise the wallet will be locked
   */
  static loadWallet(keystore, provider, password) {
      if (!Array.isArray(keystore)) keystore = [ keystore ];

      return createGivethWallet(keystore, provider, password);
  }

  /**
   * fetches the locally cached keystore from storage
   */
  static getCachedKeystore() {
    return localforage.getItem(STORAGE_KEY)
      .then(ks => {
        if (ks && ks.length > 0) return ks;

        throw new Error('No keystore found');
      });
  }

  /**
   * remove the locally cached keystore from storage
   */
  static removeCachedKeystore() {
    localforage.removeItem(STORAGE_KEY);
  }
}

const createGivethWallet = (keystore, provider, password) => {
  const wallet = new GivethWallet(provider, keystore);

  if (password) return wallet.unlock(password).then(() => wallet);

  return Promise.resolve(wallet);
};

export default GivethWallet;