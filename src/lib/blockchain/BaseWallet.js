import { utils } from 'web3';
import localforage from 'localforage';
import Accounts from 'web3-eth-accounts';

/* global alert, window */

class BaseWallet {
  /**
   * @param provider      optional. This is necessary when signing a transaction to
   *                      retrieve chainId, gasPrice, and nonce automatically
   * @param web3          optional. Using dependency injection for testability
   */
  constructor(address, web3 = {}) {
    this.util = new Accounts()
    this.web3 = web3;
    // hardcoded wallet fields depended upon somewhere
    // faking these until I learn more and come up with idea to handle
    this.unlocked = true;
    this.keystores = [''];
    this.balance = undefined;
    this.tokenBalance = undefined;
    this.address = address;
  }

  /**
   * return the balance of the wallet
   *
   * @param unit (optional) ether, finney, wei, etc
   * @return {String}
   */
  getBalance (unit) {
    return (this.balance) ? utils.fromWei(this.balance, unit || 'ether') : undefined;
    // no idea of this works but figured it should look something like this maybe
    // TODO: test this at least once
    // const balance = this.web3.eth.getBalance(this.fromAddress);
    // if (balance) return utils.fromWei(balance, unit || 'ether');
    // return undefined;
  }
  
  getTokenBalance(unit) {
    return this.tokenBalance ? utils.fromWei(this.tokenBalance, unit || 'ether') : undefined;
  }
  // fake function to satisfy dapp expectations on internal wallet
  // TODO: think about this more and figure out solution
  lock() {
    this.unlocked = false;
  }

  // fake function to satisfy dapp expectations on internal wallet
  // TODO: think about this more and figure out solution
  unlock() {
    return new Promise((resolve, reject) => {
      if (this.unlocked || !this.unlocked) {
        return resolve(true);
      }
      return reject();
    });
  }

  /**
   * @return {Array} of addresses in this wallet
   */
  getAddresses() {
    // might make sense to add a check for valid address and error if not
    return [this.address];
  }

  /**
   * sign a transaction with the first account.
   *
   * @param     txData the txData to sign. chainId, gasPrice, and nonce are required
   * @returns   signature object. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#signtransaction
   */
  signTransaction(txData) {
    if (!txData.gasPrice || !txData.nonce || !txData.chainId)
      throw new Error('gasPrice, nonce, and chainId are required');
    return this.web3.eth.sendTransaction(txData);
  }

  /**
   * sign a message with the first account
   *
   * @param msg   the message to sign
   * @returns     object containing signature data. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
   */
  signMessage(msg, acc) {
    // msg and from are in different order in web3-1.x from previous versions
    return this.web3.eth.sign(this.web3.utils.sha3(msg));
  }

  /**
   * generate a dapp wallet representation of web injected wallet
   * @param provider - optional
   * @param password - password to encrypt the wallet with
   */
  static createWallet(provider) {
    // declare web3 from window
    const { web3 } = window;
    const wallet = new BaseWallet(provider, web3);
    return new Promise(resolve => {
      resolve(Promise.resolve(wallet));
    });
  }

  /**
   * some type checking thing broke
   * so I put this here to copy GivethWallet
   * locally caches the keystores in storage
   */
  cacheKeystore() {
    localforage.setItem('keystore', this.keystores);
  }
}

export default BaseWallet;
