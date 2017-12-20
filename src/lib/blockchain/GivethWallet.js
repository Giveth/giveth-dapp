/* global window */
import localforage from 'localforage';
import Accounts from 'web3-eth-accounts';
import { utils } from 'web3';

const STORAGE_KEY = 'keystore';

const mapGet = WeakMap.prototype.get;
const mapSet = WeakMap.prototype.set;

const mapAccounts = new WeakMap();
const mapPassword = new WeakMap();

/**
 * Wallet to handle ethereum accounts. While this wallet can store multiple accounts,
 * we currently sign using only the first account.
 *
 * TODO: allow account specification for signing tx/messages
 */
class GivethWallet {
  /**
   * @param keystores     array of keystores to add to the wallet
   * @param provider      optional. This is necessary when signing a transaction to
   *                      retrieve chainId, gasPrice, and nonce automatically
   */
  constructor(keystores, provider) {
    if (!Array.isArray(keystores) || keystores.length === 0)
      throw new Error('keystores is required. and must be an array');

    const accounts = new Accounts(provider);
    mapSet.call(mapAccounts, this, accounts);

    this.keystores = keystores;
    this.unlocked = false;
    this.balance = undefined;
  }

  /**
   * return the balance of the wallet
   *
   * @param unit (optional) ether, finney, wei, etc
   * @return {String}
   */
  getBalance(unit) {
    return this.balance
      ? utils.fromWei(this.balance, unit || 'ether')
      : undefined;
  }

  /**
   * sign a transaction with the first account.
   *
   * @param     txData the txData to sign. chainId, gasPrice, and nonce are required
   * @returns   signature object. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#signtransaction
   */
  signTransaction(txData) {
    if (!this.unlocked) throw new Error('Locked Wallet');

    if (!txData.gasPrice || !txData.nonce || !txData.chainId)
      throw new Error('gasPrice, nonce, and chainId are required');

    const accounts = mapGet.call(mapAccounts, this);

    return accounts.wallet[0].signTransaction(txData);
  }

  /**
   * sign a message with the first account
   *
   * @param msg   the message to sign
   * @returns     object containing signature data. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
   */
  signMessage(msg) {
    if (!this.unlocked) throw new Error('Locked Wallet');

    const accounts = mapGet.call(mapAccounts, this);

    return accounts.wallet[0].sign(msg || '');
  }

  unlock(password) {
    return new Promise((resolve, reject) => {
      if (this.unlocked) {
        return resolve(true);
      }

      mapSet.call(mapPassword, this, password);

      const decrypt = () => {
        const accounts = mapGet.call(mapAccounts, this);
        try {
          accounts.wallet.decrypt(this.keystores, password);
        } catch (e) {
          return reject(e);
        }

        this.unlocked = true;
        return resolve(true);
      };

      return decrypt();

      // web3 blocks all rendering, so we need to request an animation frame
      // window.requestAnimationFrame(decrypt)
    });
  }

  lock() {
    if (!this.unlocked) return;

    const accounts = mapGet.call(mapAccounts, this);
    accounts.wallet.clear();
    this.unlocked = false;
  }

  /**
   * remove all accounts from this wallet
   */
  clear() {
    mapGet.call(mapAccounts, this).wallet.clear();
  }

  /**
   * @return {Array} of addresses in this wallet
   */
  getAddresses() {
    if (this.unlocked) {
      const { wallet } = mapGet.call(mapAccounts, this);
      const addrs = [];

      for (let i = 0; i < wallet.length; i += 1) {
        addrs[i] = wallet[i].address;
      }

      return addrs;
    }

    return this.keystores.map(account =>
      GivethWallet.fixAddress(account.address),
    );
  }

  /**
   * locally caches the keystores in storage
   */
  cacheKeystore() {
    localforage.setItem('keystore', this.keystores);
  }

  /**
   * normalize an address to the 0x form
   */
  static fixAddress(addr) {
    return addr.toLowerCase().startsWith('0x') ? addr : `0x${addr}`;
  }

  static createGivethWallet(keystore, provider, password) {
    const wallet = new GivethWallet(keystore, provider);
    if (password) {
      return wallet.unlock(password).then(() => wallet);
    }
    return Promise.resolve(wallet);
  }

  /**
   * generate a new wallet with a new keystore
   * @param provider - optional
   * @param password - password to encrypt the wallet with
   */
  static createWallet(provider, password) {
    return new Promise(resolve => {
      const createWallet = () => {
        const keystore = new Accounts(provider).wallet
          .create(1)
          .encrypt(password);
        resolve(GivethWallet.createGivethWallet(keystore, provider, password));
      };

      // web3 blocks all rendering, so we need to request an animation frame
      window.requestAnimationFrame(createWallet);
    });
  }

  /**
   * loads a GivethWallet with the provided keystores.
   *
   * @param keystore    the keystores to hold in the wallet
   * @param provider    optional. web3 provider
   * @param password    optional. if provided, the returned wallet will be unlocked,
   *                    otherwise the wallet will be locked
   */
  static loadWallet(keystore, provider, password) {
    if (!keystore) throw new Error('keystore is required');

    let modifiedKeystore = keystore;
    if (!Array.isArray(keystore)) {
      modifiedKeystore = [keystore];
    }

    return GivethWallet.createGivethWallet(
      modifiedKeystore,
      provider,
      password,
    );
  }

  /**
   * fetches the locally cached keystore from storage
   */
  static getCachedKeystore() {
    return localforage.getItem(STORAGE_KEY).then(ks => {
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

export default GivethWallet;
